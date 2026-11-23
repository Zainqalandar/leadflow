export type TemplateLead = {
  ownerName?: string | null;
  name?: string | null;
};

export function renderTemplate(body: string, lead: TemplateLead): string {
  const naam = lead.ownerName?.trim() || "sahab";
  const business = lead.name ?? "";

  return body.replace(/\{naam\}/g, naam).replace(/\{business\}/g, business);
}
