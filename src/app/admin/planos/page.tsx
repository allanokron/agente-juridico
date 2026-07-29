"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "R$ 0",
    period: "/mês",
    description: "Para escritórios pequenos",
    features: [
      { name: "3 usuários", included: true },
      { name: "50 processos", included: true },
      { name: "5 GB armazenamento", included: true },
      { name: "Suporte por email", included: true },
      { name: "Integração WhatsApp", included: false },
      { name: "IA Assistente", included: false },
    ],
    current: false,
  },
  {
    name: "Basic",
    price: "R$ 97",
    period: "/mês",
    description: "Para escritórios em crescimento",
    features: [
      { name: "10 usuários", included: true },
      { name: "200 processos", included: true },
      { name: "20 GB armazenamento", included: true },
      { name: "Suporte prioritário", included: true },
      { name: "Integração WhatsApp", included: false },
      { name: "IA Assistente", included: false },
    ],
    current: false,
  },
  {
    name: "Pro",
    price: "R$ 197",
    period: "/mês",
    description: "Para escritórios estabelecidos",
    features: [
      { name: "25 usuários", included: true },
      { name: "Ilimitado processos", included: true },
      { name: "50 GB armazenamento", included: true },
      { name: "Suporte 24/7", included: true },
      { name: "Integração WhatsApp", included: true },
      { name: "IA Assistente", included: false },
    ],
    current: true,
  },
  {
    name: "Enterprise",
    price: "R$ 397",
    period: "/mês",
    description: "Para grandes escritórios",
    features: [
      { name: "Ilimitado usuários", included: true },
      { name: "Ilimitado processos", included: true },
      { name: "100 GB armazenamento", included: true },
      { name: "Suporte dedicado", included: true },
      { name: "Integração WhatsApp", included: true },
      { name: "IA Assistente", included: true },
    ],
    current: false,
  },
];

export default function PlansPage() {
  return (
    <DashboardLayout isAdmin>
      <div className="space-y-6">
        <PageHeader
          title="Planos"
          description="Gerencie os planos da plataforma"
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`border-slate-200 relative ${plan.current ? 'border-teal-500 shadow-lg' : ''}`}
            >
              {plan.current && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-teal-500">Plano Atual</Badge>
                </div>
              )}
              <CardHeader className="text-center pt-8">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-slate-500">{plan.period}</span>
                </div>
                <CardDescription className="mt-2">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature.name} className="flex items-center gap-2">
                      {feature.included ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <X className="h-4 w-4 text-slate-300" />
                      )}
                      <span className={`text-sm ${!feature.included ? 'text-slate-400' : ''}`}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full mt-6 ${
                    plan.current 
                      ? 'bg-slate-100 text-slate-500 cursor-not-allowed' 
                      : 'bg-slate-900 hover:bg-slate-800'
                  }`}
                  disabled={plan.current}
                >
                  {plan.current ? 'Plano Atual' : 'Selecionar'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
