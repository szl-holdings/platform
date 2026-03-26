import * as React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Plus, MoreHorizontal, LayoutGrid, Clock, Target } from "lucide-react";
import { useCampaigns, useCreateCampaign } from "@/hooks/use-campaigns";
import { Button, Card, Badge, Input } from "@/components/ui";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export function Workspace() {
  const { data: campaigns, isLoading } = useCampaigns();
  const createCampaign = useCreateCampaign();
  const [isCreating, setIsCreating] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    createCampaign.mutate({ name: newTitle }, {
      onSuccess: () => {
        setNewTitle("");
        setIsCreating(false);
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Campaign Workspace</h1>
          <p className="text-muted-foreground mt-1">Manage active creative projects and timelines.</p>
        </div>
        
        {isCreating ? (
          <div className="flex items-center gap-2">
            <Input 
              autoFocus
              placeholder="Campaign name..." 
              value={newTitle} 
              onChange={e => setNewTitle(e.target.value)} 
              onKeyDown={e => e.key === "Enter" && handleCreate()}
            />
            <Button onClick={handleCreate} disabled={createCampaign.isPending}>Save</Button>
            <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
          </div>
        ) : (
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" /> New Campaign
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <Card key={i} className="h-48 animate-pulse bg-muted/50 border-0" />
          ))}
        </div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {campaigns?.map(campaign => (
            <motion.div key={campaign.id} variants={item}>
              <Link href={`/campaigns/${campaign.id}`} className="block group">
                <Card className="p-6 h-full border-border/50 hover:border-primary/50 hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden bg-gradient-to-b from-card to-background">
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted" onClick={e => e.preventDefault()}>
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" className="bg-background/50">{campaign.category.replace('_', ' ')}</Badge>
                    <Badge 
                      variant={campaign.status === "review" ? "warning" : campaign.status === "published" ? "success" : "default"}
                    >
                      {campaign.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{campaign.name}</h3>
                  <p className="text-sm text-muted-foreground mb-6 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" /> Client: {campaign.client}
                  </p>
                  
                  <div className="space-y-4 mt-auto">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium text-foreground">{campaign.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" 
                          style={{ width: `${campaign.progress}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Due {format(new Date(campaign.deadline), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
