"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

interface Log {
  id: string;
  data: string;
  usuario: string;
  empresa: string;
  acao: string;
  entidade: string;
  ip: string;
}

const mockLogs: Log[] = [
  {
    id: "1",
    data: "25/01/2026 09:30:15",
    usuario: "Dr. João Silva",
    empresa: "Silva & Associados",
    acao: "LOGIN",
    entidade: "Autenticação",
    ip: "192.168.1.100",
  },
  {
    id: "2",
    data: "25/01/2026 09:35:22",
    usuario: "Dr. João Silva",
    empresa: "Silva & Associados",
    acao: "CRIAR",
    entidade: "Processo #0001234-56.2024.8.26.0001",
    ip: "192.168.1.100",
  },
  {
    id: "3",
    data: "25/01/2026 08:15:45",
    usuario: "Dra. Ana Santos",
    empresa: "Silva & Associados",
    acao: "LOGIN",
    entidade: "Autenticação",
    ip: "192.168.1.101",
  },
  {
    id: "4",
    data: "24/01/2026 17:45:30",
    usuario: "Pedro Costa",
    empresa: "Advocacia Costa",
    acao: "ATUALIZAR",
    entidade: "Cliente #123",
    ip: "192.168.1.102",
  },
  {
    id: "5",
    data: "24/01/2026 16:20:10",
    usuario: "Maria Oliveira",
    empresa: "Oliveira Advocacia",
    acao: "UPLOAD",
    entidade: "Documento Contrato.pdf",
    ip: "192.168.1.103",
  },
];

export default function LogsPage() {
  const getAcaoColor = (acao: string) => {
    switch (acao) {
      case "LOGIN":
        return "bg-blue-100 text-blue-700";
      case "CRIAR":
        return "bg-emerald-100 text-emerald-700";
      case "ATUALIZAR":
        return "bg-amber-100 text-amber-700";
      case "EXCLUIR":
        return "bg-red-100 text-red-700";
      case "UPLOAD":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <DashboardLayout isAdmin>
      <div className="space-y-6">
        <PageHeader
          title="Logs"
          description="Histórico de atividades da plataforma"
        />

        <Card className="border-slate-200">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm text-slate-500">
                      {log.data}
                    </TableCell>
                    <TableCell>{log.usuario}</TableCell>
                    <TableCell>{log.empresa}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getAcaoColor(log.acao)}>
                        {log.acao}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.entidade}</TableCell>
                    <TableCell className="font-mono text-sm text-slate-500">
                      {log.ip}
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
