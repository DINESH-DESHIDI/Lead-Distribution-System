"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export default function RequestService() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    customerName: "",
    phoneNumber: "",
    city: "",
    serviceId: "",
    description: "",
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const services = [
    { value: "srv-1", label: "Service 1 (Mandatory: Provider 1)" },
    { value: "srv-2", label: "Service 2 (Mandatory: Provider 5)" },
    { value: "srv-3", label: "Service 3 (Mandatory: Provider 1 & 4)" },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, serviceId: e.target.value }));
    if (errors.serviceId) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.serviceId;
        return copy;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.customerName.trim()) newErrors.customerName = "Name is required.";
    
    const phoneClean = formData.phoneNumber.replace(/\D/g, "");
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required.";
    } else if (phoneClean.length < 7 || phoneClean.length > 15) {
      newErrors.phoneNumber = "Invalid phone number length. Must be 7-15 digits.";
    }

    if (!formData.city.trim()) newErrors.city = "City is required.";
    if (!formData.serviceId) newErrors.serviceId = "Service type selection is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          toast(
            "Enquiry blocked: You have already submitted a lead for this service using this phone number.",
            "error"
          );
        } else {
          toast(data.error || "Failed to submit enquiry.", "error");
        }
        return;
      }

      toast(
        `Lead created! Successfully allocated to: ${data.assignedProviders.join(", ")}`,
        "success"
      );
      
      // Clear form
      setFormData({
        customerName: "",
        phoneNumber: "",
        city: "",
        serviceId: "",
        description: "",
      });
    } catch (error) {
      console.error("Submission error:", error);
      toast("A connection issue occurred. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-6">
      <Card className="border border-border/80 bg-neutral-950/40">
        <CardHeader className="space-y-2 border-b border-border/40 pb-5 mb-6">
          <CardTitle className="text-2xl font-bold text-white">Request Service</CardTitle>
          <CardDescription>
            Submit an enquiry below. Our system will immediately process and fairly allocate you to our top-rated service providers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              name="customerName"
              label="Full Name"
              placeholder="e.g. John Doe"
              value={formData.customerName}
              onChange={handleInputChange}
              error={errors.customerName}
            />

            <Input
              name="phoneNumber"
              label="Phone Number"
              placeholder="e.g. 9999999999 (digits only)"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              error={errors.phoneNumber}
            />

            <Input
              name="city"
              label="City"
              placeholder="e.g. San Francisco"
              value={formData.city}
              onChange={handleInputChange}
              error={errors.city}
            />

            <Select
              name="serviceId"
              label="Service Type"
              options={services}
              value={formData.serviceId}
              onChange={handleSelectChange}
              error={errors.serviceId}
            />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Enquiry Details / Description (Optional)
              </label>
              <textarea
                name="description"
                rows={4}
                className="flex w-full rounded-lg border border-border bg-card/60 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-white/20 transition-all resize-none"
                placeholder="e.g. Need assistance with residential installation..."
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full text-base font-semibold py-2.5 h-11"
                isLoading={isLoading}
              >
                Submit Service Request
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
