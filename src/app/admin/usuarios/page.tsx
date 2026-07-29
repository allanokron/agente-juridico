"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Users, Plus, Search, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface User {
  id: string;
  nome: string;
  email: string;
  empresa: string;
  role: string;
  status: string;
  ultimoAcesso: string;
  iniciais: string;
}

const mockUsers: User[] = [
  {
    id: "1",
    nome: "Dr. João Silva",
    email: "joao@silva.com",
    empresa: "Silva & Associados",
    role: "Administrador",
    status: "Ativo",
    ultimoAcesso: "Hoje, 09:30",
    iniciais: "JS",
  },
  {
    id: "2",
    nome: "Dra. Ana Santos",
    email: "ana@silva.com",
    empresa: "Silva & Associados",
    role: "Advogado",
    status: "Ativo",
    ultimoAcesso: "Hoje, 08:15",
    iniciais: "AS",
  },
  {
    id: "3",
    nome: "Pedro Costa",
    email: "pedro@costa.com",
    empresa: "Advocacia Costa",
    role: "Administrador",
    status: "Ativo",
    ultimoAcesso: "Ontem, 17:45",
    iniciais: "PC",
  },
  {
    id: "4",
    nome: "Maria Oliveira",
    email: "maria@oliveira.com",
    empresa: "Oliveira Advocacia",
    role: "Advogado",
    status: "Ativo",
    ultimoAcesso: "15/01/2026",
    iniciais: "MO",
  },
];

export default function UsersPage() {
  const [users] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = users.filter(
    (user) =>
      user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.empresa.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Administrador":
        return "bg-purple-100 text-purple-700";
      case "Advogado":
        return "bg-blue-100 text-blue-700";
      case "Assistente":
        return "bg-emerald-100 text-emerald-700";
      case "Estagiário":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <DashboardLayout isAdmin>
      <div className="space-y-6">
        <PageHeader
          title="Usuários"
          description="Gerencie todos os usuários da plataforma"
          action={{
            label: "Novo Usuário",
            onClick: () => {},
            icon: <Plus className="h-4 w-4 mr-2" />,
          }}
        />

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar por nome, email ou empresa..."
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
                  <TableHead>Usuário</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-slate-100 text-slate-600 text-sm font-medium">
                            {user.iniciais}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.nome}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.empresa}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">{user.ultimoAcesso}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                         <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted hover:text-foreground cursor-pointer outline-none">
                            <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Desativar
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
