import { Role, TipoProcesso, StatusProcesso, TipoArquivo, TipoEvento, Prioridade, StatusEvento } from "@/generated/prisma/enums";

// ============================================
// TYPES GLOBAIS
// ============================================

export type { 
  Empresa, 
  Usuario, 
  Cliente, 
  Processo, 
  Documento, 
  Evento, 
  Anotacao, 
  Historico, 
  Log, 
  Notificacao, 
  Plano,
  EtapasKanban,
  KanbanCard,
  ProcessoAtribuicao,
} from "@/generated/prisma/client";

export { 
  Role, 
  TipoProcesso, 
  StatusProcesso, 
  TipoArquivo, 
  TipoEvento, 
  Prioridade, 
  StatusEvento 
};

// ============================================
// TYPES DE API
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  orderBy?: string;
  order?: "asc" | "desc";
}

// ============================================
// TYPES DE USUÁRIO
// ============================================

export interface UserSession {
  id: string;
  clerkId?: string;
  email: string;
  nome: string;
  role: Role;
  empresaId: string;
  avatar?: string | null;
  cargo?: {
    id: string;
    nome: string;
    permissoes: unknown;
  } | null;
}

// ============================================
// TYPES DE DASHBOARD
// ============================================

export interface DashboardStats {
  processosAtivos: number;
  prazosHoje: number;
  prazosAmanha: number;
  prazosSemana: number;
  documentosPendentes: number;
  totalClientes: number;
  totalDocumentos: number;
  totalNotificacoes: number;
}

export interface AdminDashboardStats {
  totalEscritorios: number;
  totalUsuarios: number;
  totalProcessos: number;
  totalDocumentos: number;
  totalNotificacoes: number;
  usoSistema: number;
  espacoUtilizado: number;
  ultimosAcessos: Array<{
    usuario: string;
    empresa: string;
    data: Date;
  }>;
}

// ============================================
// TYPES DE FILTROS
// ============================================

export interface ProcessoFilters extends PaginationParams {
  status?: StatusProcesso;
  tipoProcesso?: TipoProcesso;
  clienteId?: string;
  responsavelId?: string;
}

export interface ClienteFilters extends PaginationParams {
  ativo?: boolean;
}

export interface EventoFilters extends PaginationParams {
  tipo?: TipoEvento;
  prioridade?: Prioridade;
  status?: StatusEvento;
  dataInicio?: Date;
  dataFim?: Date;
}

// ============================================
// TYPES DE FORMULÁRIOS
// ============================================

export interface ClienteFormData {
  nome: string;
  cpfCnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  observacoes?: string;
}

export interface ProcessoFormData {
  clienteId: string;
  responsavelId: string;
  numeroProcesso?: string;
  tribunal?: string;
  vara?: string;
  tipoProcesso: TipoProcesso;
  observacoes?: string;
}

export interface EventoFormData {
  titulo: string;
  descricao?: string;
  data: Date;
  hora?: string;
  tipo: TipoEvento;
  prioridade: Prioridade;
  processoId?: string;
  clienteId?: string;
  responsavelId: string;
}

export interface DocumentoFormData {
  nome: string;
  descricao?: string;
  processoId?: string;
  arquivo: File;
}
