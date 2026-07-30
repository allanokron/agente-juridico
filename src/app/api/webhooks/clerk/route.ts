import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

type ClerkUserData = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
  primary_email_address_id?: string | null;
  email_addresses?: Array<{
    id: string;
    email_address: string;
    verification?: { status?: string | null } | null;
  }>;
  public_metadata?: Record<string, unknown> | null;
};

function getVerifiedPrimaryEmail(data: ClerkUserData) {
  const address = data.email_addresses?.find(
    (item) => item.id === data.primary_email_address_id
  );
  return address?.verification?.status === "verified"
    ? address.email_address.trim().toLowerCase()
    : null;
}

function getDisplayName(data: ClerkUserData) {
  return [data.first_name, data.last_name].filter(Boolean).join(" ").trim();
}

export async function POST(request: NextRequest) {
  try {
    const event = await verifyWebhook(request);

    if (event.type === "user.created" || event.type === "user.updated") {
      const data = event.data as ClerkUserData;
      const metadataUserId =
        typeof data.public_metadata?.appUserId === "string"
          ? data.public_metadata.appUserId
          : null;
      const verifiedEmail = getVerifiedPrimaryEmail(data);
      const name = getDisplayName(data);

      const existing = await prisma.usuario.findFirst({
        where: {
          OR: [
            { clerkId: data.id },
            ...(metadataUserId
              ? [{ id: metadataUserId, clerkId: null }]
              : []),
            ...(verifiedEmail
              ? [{ email: { equals: verifiedEmail, mode: "insensitive" as const }, clerkId: null }]
              : []),
          ],
        },
      });

      if (existing) {
        const emailOwner = verifiedEmail
          ? await prisma.usuario.findUnique({
              where: { email: verifiedEmail },
              select: { id: true },
            })
          : null;
        await prisma.usuario.update({
          where: { id: existing.id },
          data: {
            clerkId: data.id,
            ...((event.type === "user.created" || !existing.clerkId) && {
              ativo: true,
            }),
            clerkInvitationId: null,
            ...(verifiedEmail &&
              (!emailOwner || emailOwner.id === existing.id) && {
                email: verifiedEmail,
              }),
            ...(name && { nome: name }),
            ...(data.image_url && { avatar: data.image_url }),
          },
        });
      }
    }

    if (event.type === "user.deleted" && event.data.id) {
      await prisma.usuario.updateMany({
        where: { clerkId: event.data.id },
        data: { ativo: false },
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Webhook Clerk rejeitado:", error);
    return Response.json({ error: "Webhook inválido" }, { status: 400 });
  }
}
