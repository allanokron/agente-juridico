import "dotenv/config";
import pg from "pg";

const ALMEIDA_SAKURADA_ID = "cms85ekgp000004kzu3g95rcm";

async function main() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    console.log("Migrando recibos existentes da empresa ASA para tipo EXCLUSIVO...");

    // 1. Atualizar todos os recibos existentes da empresa ASA para tipo EXCLUSIVO
    const updatedRecibos = await client.query(
      `UPDATE recibos SET tipo = 'EXCLUSIVO' WHERE "empresaId" = $1 AND (tipo IS NULL OR tipo = 'REGULAR')`,
      [ALMEIDA_SAKURADA_ID]
    );
    console.log(`Recibos atualizados para EXCLUSIVO: ${updatedRecibos.rowCount}`);

    // 2. Buscar o maior número de recibo exclusivo
    const maxResult = await client.query(
      `SELECT COALESCE(MAX(numero), 0) + 1 as proximo FROM recibos WHERE "empresaId" = $1 AND tipo = 'EXCLUSIVO'`,
      [ALMEIDA_SAKURADA_ID]
    );
    const proximoNumero = maxResult.rows[0].proximo;

    // 3. Criar ou atualizar registro de numeração
    const existingNumeracao = await client.query(
      `SELECT id FROM recibos_exclusivos_numeracao WHERE "empresaId" = $1`,
      [ALMEIDA_SAKURADA_ID]
    );

    if (existingNumeracao.rows.length > 0) {
      await client.query(
        `UPDATE recibos_exclusivos_numeracao SET "proximoNumero" = $1 WHERE "empresaId" = $2`,
        [proximoNumero, ALMEIDA_SAKURADA_ID]
      );
    } else {
      // Generate a cuid-like id
      const id = `cl${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
      await client.query(
        `INSERT INTO recibos_exclusivos_numeracao (id, "empresaId", "proximoNumero") VALUES ($1, $2, $3)`,
        [id, ALMEIDA_SAKURADA_ID, proximoNumero]
      );
    }
    console.log(`Numeração exclusiva iniciada em: ${proximoNumero}`);

    // 4. Atualizar serviços tipos existentes da empresa ASA para tipo EXCLUSIVO
    const updatedServicos = await client.query(
      `UPDATE servico_tipos SET tipo = 'EXCLUSIVO' WHERE "empresaId" = $1 AND (tipo IS NULL OR tipo = 'REGULAR')`,
      [ALMEIDA_SAKURADA_ID]
    );
    console.log(`Serviços tipos atualizados para EXCLUSIVO: ${updatedServicos.rowCount}`);

    console.log("Migração concluída com sucesso!");
  } finally {
    await client.end();
  }
}

main()
  .catch((e) => {
    console.error("Erro na migração:", e);
    process.exit(1);
  });
