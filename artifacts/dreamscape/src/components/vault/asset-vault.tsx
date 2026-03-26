import * as React from "react";
import { Upload, Image as ImageIcon, Video, FileAudio, FileText, Trash2, Tag } from "lucide-react";
import { useAssets, useDeleteAsset } from "@/hooks/use-creative";
import { Button, Card, Badge } from "@/components/ui";

const TYPE_ICONS = {
  image: ImageIcon,
  video: Video,
  audio: FileAudio,
  document: FileText,
  font: FileText,
  template: FileText
};

export function AssetVault({ campaignId }: { campaignId: string }) {
  const { data: assets, isLoading } = useAssets(campaignId);
  const deleteAsset = useDeleteAsset();

  if (isLoading) return <div className="animate-pulse h-full bg-muted/20 rounded-xl" />;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-foreground">Campaign Asset Vault</h2>
          <p className="text-sm text-muted-foreground">Manage brand assets, final renders, and source files.</p>
        </div>
        <Button>
          <Upload className="w-4 h-4 mr-2" /> Upload Assets
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {assets?.map(asset => {
          const Icon = TYPE_ICONS[asset.type] || FileText;
          return (
            <Card key={asset.id} className="group overflow-hidden flex flex-col relative border-border/60 hover:border-primary/50 transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="w-8 h-8 rounded shadow-md"
                  onClick={() => deleteAsset.mutate({ id: asset.id, campaignId })}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="aspect-square bg-muted border-b border-border flex items-center justify-center p-4 relative overflow-hidden">
                {asset.type === 'image' && asset.url ? (
                  <img src={asset.url} alt={asset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <Icon className="w-16 h-16 text-muted-foreground/50" />
                )}
                <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur px-2 py-1 rounded text-xs font-medium border border-border text-foreground uppercase tracking-wider">
                  {asset.type}
                </div>
              </div>
              
              <div className="p-4 flex flex-col flex-1">
                <h4 className="text-sm font-semibold text-foreground truncate mb-1" title={asset.name}>
                  {asset.name}
                </h4>
                <p className="text-xs text-muted-foreground mb-3">{asset.size}</p>
                
                <div className="mt-auto flex flex-wrap gap-1.5">
                  {asset.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-[10px] py-0 h-5 bg-muted/50">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
