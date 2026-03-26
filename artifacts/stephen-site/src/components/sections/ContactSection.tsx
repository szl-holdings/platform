import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Calendar, Mail, MapPin } from "lucide-react";

import { useCreateStephenBookingRequest } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  role: z.string().optional(),
  type: z.enum(["consultation", "project", "recruitment", "partnership", "other"]),
  message: z.string().min(10, "Please provide more details"),
  preferredDate: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function ContactSection() {
  const { toast } = useToast();
  const mutation = useCreateStephenBookingRequest();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      role: "",
      type: "consultation",
      message: "",
      preferredDate: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await mutation.mutateAsync({ data });
      toast({
        title: "Request Submitted",
        description: "Your meeting request has been successfully sent. We will be in touch shortly.",
      });
      form.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "There was an error sending your request. Please try again.",
      });
    }
  };

  return (
    <section id="contact" className="py-24 bg-secondary/20 relative border-t border-white/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">Let's Connect</h2>
            <h3 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">Start a Conversation</h3>
            <p className="text-muted-foreground text-lg mb-12 max-w-md">
              Whether you're looking for technical leadership, enterprise architecture consulting, or strategic partnerships, let's explore how we can collaborate.
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-background border border-border flex items-center justify-center shrink-0 text-primary">
                  <Mail size={20} />
                </div>
                <div>
                  <h5 className="font-medium text-foreground mb-1">Direct Inquiries</h5>
                  <p className="text-muted-foreground">stephen@szlholdings.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-background border border-border flex items-center justify-center shrink-0 text-primary">
                  <MapPin size={20} />
                </div>
                <div>
                  <h5 className="font-medium text-foreground mb-1">Headquarters</h5>
                  <p className="text-muted-foreground">Washington, D.C. Metro<br />Global Availability</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass-panel p-8 sm:p-10 rounded-3xl"
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" className="bg-background border-border" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="john@example.com" className="bg-background border-border" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Corp" className="bg-background border-border" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="CTO" className="bg-background border-border" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inquiry Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="consultation">Strategic Consultation</SelectItem>
                          <SelectItem value="project">Project Collaboration</SelectItem>
                          <SelectItem value="recruitment">Recruitment / Role</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferredDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Timeline/Date (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type="date" className="bg-background border-border pl-10" {...field} />
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message Details</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please provide specifics about your project or inquiry..." 
                          className="bg-background border-border min-h-[120px] resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full py-6 text-base rounded-xl font-bold shadow-lg shadow-primary/20"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? "Submitting..." : "Submit Request"}
                </Button>
              </form>
            </Form>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
