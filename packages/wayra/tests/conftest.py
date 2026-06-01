# SPDX-License-Identifier: Apache-2.0
"""Shared pytest fixtures + canned source payloads for WAYRA adapter tests."""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from wayra.core.khipu_emit import IngestLog


@pytest.fixture
def log(tmp_path):
    db = tmp_path / "test_ingest.db"
    lg = IngestLog(db_path=db)
    yield lg
    lg.close()


# ---- canned GitHub releases.atom ----
CANNED_GH_ATOM = b"""<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Release notes from zarf</title>
  <entry>
    <id>tag:github.com,2008:Repository/398998426/v0.77.0</id>
    <updated>2026-05-28T18:53:02Z</updated>
    <link rel="alternate" type="text/html" href="https://github.com/zarf-dev/zarf/releases/tag/v0.77.0"/>
    <title>v0.77.0</title>
    <content type="html">&lt;h3&gt;Features&lt;/h3&gt;&lt;p&gt;signed init packages, keyless signing and offline verification support added in this release for airgap delivery.&lt;/p&gt;</content>
  </entry>
  <entry>
    <id>tag:github.com,2008:Repository/398998426/v0.76.0</id>
    <updated>2026-05-20T10:00:00Z</updated>
    <link rel="alternate" type="text/html" href="https://github.com/zarf-dev/zarf/releases/tag/v0.76.0"/>
    <title>v0.76.0</title>
    <content type="html">&lt;p&gt;Bug fixes and dependency bumps for the package mirror flow.&lt;/p&gt;</content>
  </entry>
</feed>"""

# ---- canned arXiv RSS ----
CANNED_ARXIV_RSS = b"""<?xml version='1.0' encoding='UTF-8'?>
<rss xmlns:arxiv="http://arxiv.org/schemas/atom" xmlns:dc="http://purl.org/dc/elements/1.1/" version="2.0">
  <channel>
    <title>cs.LO updates on arXiv.org</title>
    <item>
      <title>A Lean-Verified Calculus for Bounded Agentic Utility</title>
      <link>https://arxiv.org/abs/2605.12345</link>
      <description>arXiv:2605.12345v1 Announce Type: new
Abstract: We present a formally verified calculus in Lean 4 for bounded agentic utility, proving monotonicity and a Bekenstein-style bound on the action space. The construction is positive-homogeneous and zero-pinned, matching the SZL Lambda invariant family.</description>
      <guid isPermaLink="false">oai:arXiv.org:2605.12345v1</guid>
      <dc:rights>http://creativecommons.org/licenses/by/4.0/</dc:rights>
      <dc:creator>A. Researcher, B. Prover</dc:creator>
    </item>
    <item>
      <title>Buy Now Free Download Crypto Airdrop Click Here</title>
      <link>https://arxiv.org/abs/2605.99999</link>
      <description>arXiv:2605.99999v1 Announce Type: new
Abstract: free download click here 100% guaranteed casino giveaway viagra crack keygen.</description>
      <guid isPermaLink="false">oai:arXiv.org:2605.99999v1</guid>
      <dc:creator>Spam Bot</dc:creator>
    </item>
  </channel>
</rss>"""

# ---- canned vendor press RSS ----
CANNED_PRESS_RSS = b"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>Anduril Newsroom</title>
  <item>
    <title>Anduril announces new autonomous counter-UAS interceptor</title>
    <link>https://www.anduril.com/news/new-interceptor</link>
    <description>Anduril today unveiled a new autonomous counter-UAS interceptor with on-board edge autonomy and Lattice integration.</description>
    <pubDate>Wed, 28 May 2026 12:00:00 GMT</pubDate>
    <guid>https://www.anduril.com/news/new-interceptor</guid>
  </item>
</channel></rss>"""

# ---- canned USASpending award JSON ----
CANNED_USASPENDING = b"""{"results":[{"Award ID":"FA8750-26-C-0001","Recipient Name":"Example Defense Corp","Award Amount":12500000.0,"Description":"COUNTER-UAS AUTONOMY RESEARCH AND DEVELOPMENT","Awarding Agency":"Department of Defense","Start Date":"2026-04-01","generated_internal_id":"CONT_AWD_FA875026C0001"}]}"""

# ---- canned standards Atom (IETF SCITT) ----
CANNED_STD_ATOM = b"""<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>SCITT WG</title>
  <entry>
    <id>https://datatracker.ietf.org/doc/draft-ietf-scitt-architecture/06/</id>
    <updated>2026-05-25T09:00:00Z</updated>
    <link rel="alternate" href="https://datatracker.ietf.org/doc/draft-ietf-scitt-architecture/"/>
    <title>draft-ietf-scitt-architecture-06 published</title>
    <summary>The SCITT architecture draft revision 06 adds transparency-service receipt semantics aligned with COSE and in-toto attestations.</summary>
  </entry>
</feed>"""


# ---- canned HF models (fake objects mimicking ModelInfo) ----
class _FakeCardData(dict):
    pass


class FakeModel:
    def __init__(self, mid, lm, license, pipeline="text-generation", downloads=1000,
                 likes=10, tags=None):
        self.id = mid
        self.last_modified = lm
        self.card_data = _FakeCardData({"license": license})
        self.pipeline_tag = pipeline
        self.downloads = downloads
        self.likes = likes
        self.tags = tags or ["text-generation", "transformers"]


def canned_list_models(author, limit=5):
    catalog = {
        "Qwen": [
            FakeModel("Qwen/Qwen3-Next-80B", "2026-05-29T08:00:00", "apache-2.0"),
            FakeModel("Qwen/Qwen3-VL-7B", "2026-05-27T08:00:00", "apache-2.0",
                      pipeline="image-text-to-text"),
        ],
        "deepseek-ai": [
            FakeModel("deepseek-ai/DeepSeek-V4", "2026-05-30T00:00:00", "mit"),
        ],
        "meta-llama": [
            FakeModel("meta-llama/Llama-5-70B", "2026-05-28T00:00:00",
                      "llama-community-license"),
        ],
    }
    return catalog.get(author, [])[:limit]
