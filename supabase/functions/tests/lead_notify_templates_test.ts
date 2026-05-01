import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  renderNewLeadMessage,
  renderReminderMessage,
} from "../_shared/lead-notify-templates.ts";

// lead-notify-templates contract:
//   - New-lead body in es-CO, contains greeting, place, renter, msg, move-when, URL.
//   - Reminder body contains age, renter, apartment, URL.
//   - Both stay under Twilio's 1600-char hard cap (we target ≤500).
//   - Truncation rules apply to title (60), renter (40), message (200).

const NEW_LEAD = {
  landlordFirstName: "Mario",
  renterName: "Sofia",
  apartmentTitle: "Bright 2-BR in Provenza",
  apartmentNeighborhood: "El Poblado",
  moveWhen: "now" as const,
  messageSnippet: "Is parking included? Pet-friendly?",
  leadUrl: "https://mdeai.co/host/leads",
};

Deno.test("renderNewLeadMessage — includes all key fields in Spanish", () => {
  const body = renderNewLeadMessage(NEW_LEAD);
  assertStringIncludes(body, "Hola Mario");
  assertStringIncludes(body, "Bright 2-BR in Provenza (El Poblado)");
  assertStringIncludes(body, "Sofia pregunta:");
  assertStringIncludes(body, '"Is parking included? Pet-friendly?"');
  assertStringIncludes(body, "Quiere mudarse: ahora");
  assertStringIncludes(body, "https://mdeai.co/host/leads");
  assert(body.length < 500, "body should be < 500 chars to fit nicely on phone");
});

Deno.test("renderNewLeadMessage — falls back to 'Anfitrión' when name empty", () => {
  const body = renderNewLeadMessage({ ...NEW_LEAD, landlordFirstName: "" });
  assertStringIncludes(body, "Hola Anfitrión");
});

Deno.test("renderNewLeadMessage — handles missing neighborhood", () => {
  const body = renderNewLeadMessage({ ...NEW_LEAD, apartmentNeighborhood: null });
  assertStringIncludes(body, "Bright 2-BR in Provenza");
  assert(!body.includes("(El Poblado)"));
});

Deno.test("renderNewLeadMessage — handles null moveWhen", () => {
  const body = renderNewLeadMessage({ ...NEW_LEAD, moveWhen: null });
  assertStringIncludes(body, "Sin fecha indicada");
});

Deno.test("renderNewLeadMessage — truncates oversized fields", () => {
  const body = renderNewLeadMessage({
    ...NEW_LEAD,
    apartmentTitle: "X".repeat(100),
    renterName: "Y".repeat(60),
    messageSnippet: "Z".repeat(400),
  });
  assertStringIncludes(body, "X".repeat(59) + "…");
  assertStringIncludes(body, "Y".repeat(39) + "…");
  assertStringIncludes(body, "Z".repeat(199) + "…");
});

for (const [when, label] of [
  ["now", "ahora"],
  ["soon", "pronto"],
  ["later", "más adelante"],
] as const) {
  Deno.test(`renderNewLeadMessage — moveWhen=${when} renders "${label}"`, () => {
    const body = renderNewLeadMessage({ ...NEW_LEAD, moveWhen: when });
    assertStringIncludes(body, label);
  });
}

Deno.test("renderReminderMessage — includes age, renter, title, URL", () => {
  const body = renderReminderMessage({
    landlordFirstName: "Mario",
    renterName: "Sofia",
    apartmentTitle: "Bright 2-BR",
    ageLabel: "30 min",
    leadUrl: "https://mdeai.co/host/leads",
  });
  assertStringIncludes(body, "Recordatorio (30 min)");
  assertStringIncludes(body, "Sofia aún espera respuesta");
  assertStringIncludes(body, '"Bright 2-BR"');
  assertStringIncludes(body, "https://mdeai.co/host/leads");
  assert(body.length < 500);
});

Deno.test("renderReminderMessage — truncates long apartment title", () => {
  const body = renderReminderMessage({
    landlordFirstName: "M",
    renterName: "S",
    apartmentTitle: "A".repeat(100),
    ageLabel: "30 min",
    leadUrl: "https://e/x",
  });
  assertStringIncludes(body, "A".repeat(59) + "…");
});
