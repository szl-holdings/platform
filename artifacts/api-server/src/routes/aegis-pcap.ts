import { Router, type IRouter } from "express";

type ProtoName = "modbus" | "dnp3" | "s7" | "all";

interface FrameInput {
  ts: number;
  srcIp: string;
  dstIp: string;
  srcPort?: number;
  dstPort?: number;
  protocol: "modbus" | "dnp3" | "s7";
  payloadHex?: string;
  bytes?: number;
}

interface PcapBody {
  sessionId?: string;
  frames: FrameInput[];
  filter?: {
    protocol?: ProtoName;
    startTs?: number;
    endTs?: number;
  };
}

const DEFAULT_PORTS: Record<FrameInput["protocol"], number> = {
  modbus: 502,
  dnp3: 20000,
  s7: 102,
};

function parseHex(s: string): Buffer {
  const cleaned = s.replace(/\s+/g, "");
  if (!/^[0-9a-fA-F]*$/.test(cleaned) || cleaned.length % 2 !== 0) {
    return Buffer.alloc(0);
  }
  return Buffer.from(cleaned, "hex");
}

function ipToBytes(ip: string): Buffer {
  const parts = ip.split(".").map((o) => Number.parseInt(o, 10));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return Buffer.from([0, 0, 0, 0]);
  }
  return Buffer.from(parts);
}

function ipv4Checksum(buf: Buffer): number {
  let sum = 0;
  for (let i = 0; i < buf.length; i += 2) {
    sum += buf.readUInt16BE(i);
  }
  while (sum >> 16) sum = (sum & 0xffff) + (sum >> 16);
  return (~sum) & 0xffff;
}

function buildPacket(frame: FrameInput, seqState: Map<string, number>): Buffer {
  const proto = frame.protocol;
  const dstPort = frame.dstPort ?? DEFAULT_PORTS[proto];
  const srcPort = frame.srcPort ?? 49152 + ((Math.abs(hashString(frame.srcIp)) % 1024));

  const explicitPayload = frame.payloadHex ? parseHex(frame.payloadHex) : null;
  const targetBytes = frame.bytes && frame.bytes > 54 ? frame.bytes : 54;
  const fillerLen = explicitPayload ? 0 : Math.max(0, targetBytes - 54);
  const payload = explicitPayload ?? Buffer.alloc(fillerLen);

  const eth = Buffer.alloc(14);
  eth.set([0x02, 0x00, 0x00, 0x00, 0x00, 0x02], 0);
  eth.set([0x02, 0x00, 0x00, 0x00, 0x00, 0x01], 6);
  eth.writeUInt16BE(0x0800, 12);

  const tcpHeaderLen = 20;
  const tcp = Buffer.alloc(tcpHeaderLen);
  tcp.writeUInt16BE(srcPort, 0);
  tcp.writeUInt16BE(dstPort, 2);

  const seqKey = `${frame.srcIp}:${srcPort}->${frame.dstIp}:${dstPort}`;
  const seq = seqState.get(seqKey) ?? 1;
  tcp.writeUInt32BE(seq, 4);
  seqState.set(seqKey, (seq + Math.max(payload.length, 1)) >>> 0);
  tcp.writeUInt32BE(0, 8);
  tcp.writeUInt8((tcpHeaderLen / 4) << 4, 12);
  tcp.writeUInt8(0x18, 13);
  tcp.writeUInt16BE(0xffff, 14);
  tcp.writeUInt16BE(0, 16);
  tcp.writeUInt16BE(0, 18);

  const totalLen = 20 + tcpHeaderLen + payload.length;
  const ip = Buffer.alloc(20);
  ip.writeUInt8(0x45, 0);
  ip.writeUInt8(0, 1);
  ip.writeUInt16BE(totalLen, 2);
  ip.writeUInt16BE(0, 4);
  ip.writeUInt16BE(0x4000, 6);
  ip.writeUInt8(64, 8);
  ip.writeUInt8(6, 9);
  ip.writeUInt16BE(0, 10);
  ipToBytes(frame.srcIp).copy(ip, 12);
  ipToBytes(frame.dstIp).copy(ip, 16);
  ip.writeUInt16BE(ipv4Checksum(ip), 10);

  return Buffer.concat([eth, ip, tcp, payload]);
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h;
}

const router: IRouter = Router();

router.post("/aegis/replay/pcap", (req, res) => {
  const body = req.body as PcapBody | undefined;
  if (!body || !Array.isArray(body.frames) || body.frames.length === 0) {
    res.status(400).json({ error: "frames array is required" });
    return;
  }

  const filter = body.filter ?? {};
  const protocolFilter = filter.protocol ?? "all";
  const filtered = body.frames.filter((f) => {
    if (protocolFilter !== "all" && f.protocol !== protocolFilter) return false;
    if (typeof filter.startTs === "number" && f.ts < filter.startTs) return false;
    if (typeof filter.endTs === "number" && f.ts > filter.endTs) return false;
    return true;
  });

  if (filtered.length === 0) {
    res.status(400).json({ error: "No frames match the selected protocol filter and time range" });
    return;
  }

  const globalHeader = Buffer.alloc(24);
  globalHeader.writeUInt32LE(0xa1b2c3d4, 0);
  globalHeader.writeUInt16LE(2, 4);
  globalHeader.writeUInt16LE(4, 6);
  globalHeader.writeInt32LE(0, 8);
  globalHeader.writeUInt32LE(0, 12);
  globalHeader.writeUInt32LE(65535, 16);
  globalHeader.writeUInt32LE(1, 20);

  const seqState = new Map<string, number>();
  const records: Buffer[] = [globalHeader];

  for (const f of filtered) {
    const data = buildPacket(f, seqState);
    const recHeader = Buffer.alloc(16);
    const tsSec = Math.floor(f.ts / 1000);
    const tsUsec = Math.floor((f.ts % 1000) * 1000);
    recHeader.writeUInt32LE(tsSec, 0);
    recHeader.writeUInt32LE(tsUsec, 4);
    recHeader.writeUInt32LE(data.length, 8);
    recHeader.writeUInt32LE(data.length, 12);
    records.push(recHeader, data);
  }

  const pcap = Buffer.concat(records);
  const safeId = (body.sessionId ?? "session").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
  res.setHeader("Content-Type", "application/vnd.tcpdump.pcap");
  res.setHeader("Content-Disposition", `attachment; filename="${safeId}.pcap"`);
  res.setHeader("Content-Length", String(pcap.length));
  res.setHeader("X-Pcap-Frame-Count", String(filtered.length));
  res.end(pcap);
});

export default router;
