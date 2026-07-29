"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Building2, Plus, Search, MoreHorizontal, Eye, Pencil, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Company {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  usuarios: number;
  processos: number;
  plano: string;
  status: string;
  dataCadastro: string;
}

const mockCompanies: Company[] = [
  {
    id: "1",
    nome: "Silva & Associados",
    cnpj: "12.345.678/0001-90",
    email: "contato@silva.com",
    usuarios: 8,
    processos: 156,
    plano: "Pro",
    status: "Ativo",
    dataCadastro: "01/01/2025",
  },
  {
    id: "2",
    nome: "Advocacia Costa",
    cnpj: "23.456.789/0001-01",
    email: "contato@costa.com",
    usuarios: 3,
    processos: 45,
    plano: "Basic",
    status: "Ativo",
    dataCadastro: "15/03/2025",
  },
  {
    id: "3",
    nome: "Oliveira Advocacia",
    cnpj: "34.567.890/0001-12",
    email: "contato@oliveira.com",
    usuarios: 5,
    processos: 89,
    plano: "Pro",
    status: "Ativo",
    dataCadastro: "20/06/2025",
  },
  {
    id: "4",
    nome: "Mendes & Filhos",
    cnpj: "45.678.901/0001-23",
    email: "contato@mendes.com",
    usuarios: 12,
    processos: 234,
    plano: "Enterprise",
    status: "Ativo",
    dataCadastro: "10/09/2024",
  },
];

export default function CompaniesPage() {
  const [companies] = useState<Company[]>(mockCompanies);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCompanies = companies.filter(
    (company) =>
      company.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.cnpj.includes(searchTerm) ||
      company.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPlanoColor = (plano: string) => {
    switch (plano) {
      case "Enterprise":
        return "bg-purple-100 text-purple-700";
      case "Pro":
        return "bg-blue-100 text-blue-700";
      case "Basic":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <DashboardLayout isAdmin>
      <div className="space-y-6">
        <PageHeader
          title="Empresas"
          description="Gerencie os escritórios cadastrados"
          action={{
            label: "Nova Empresa",
            onClick: () => {},
            icon: <Plus className="h-4 w-4 mr-2" />,
          }}
        />

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar por nome, CNPJ ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Table */}
        <Card className="border-slate-200">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Usuários</TableHead>
                  <TableHead>Processos</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-medium">{company.nome}</p>
                          <p className="text-xs text-slate-500">{company.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{company.cnpj}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-slate-400" />
                        {company.usuarios}
                      </div>
                    </TableCell>
                    <TableCell>{company.processos}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getPlanoColor(company.plano)}>
                        {company.plano}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                        {company.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">{company.dataCadastro}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                         <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted hover:text-foreground cursor-pointer outline-none">
                            <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
