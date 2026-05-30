import { auth } from "@teamsster/auth";
import type { TemplateType } from "@teamsster/db";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getLeagueDetail } from "@/lib/league";
import {
  createTemplateForUser,
  deleteTemplateForUser,
  getTemplatesForLeagueAsUser,
  templateTypeLabels,
} from "@/lib/template";

export default async function TemplatesPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session?.user) {
    return (
      <Card className="grid gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
        <p className="text-sm text-slate-600">
          Sign in to manage reusable templates for your league.
        </p>
        <Button asChild size="sm">
          <Link href="/account">Sign in</Link>
        </Button>
      </Card>
    );
  }

  const league = await getLeagueDetail(session.user.id, leagueId);
  if (!league) notFound();

  const allTemplates = await getTemplatesForLeagueAsUser(
    session.user.id,
    leagueId,
  );

  const groupedTemplates = allTemplates.reduce<
    Record<TemplateType, typeof allTemplates>
  >(
    (acc, template) => {
      acc[template.type] ??= [];
      acc[template.type].push(template);
      return acc;
    },
    {} as Record<TemplateType, typeof allTemplates>,
  );

  async function createAction(formData: FormData) {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to create templates.");
    }

    const type = formData.get("type") as TemplateType;
    const name = (formData.get("name") as string) ?? "";
    const description = (formData.get("description") as string) ?? "";

    await createTemplateForUser(currentSession.user.id, {
      leagueId,
      type,
      name,
      payload: { fields: {}, description: description || undefined },
    });

    revalidatePath(`/league/${leagueId}/templates`);
  }

  async function deleteAction(formData: FormData) {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to delete templates.");
    }

    const templateId = (formData.get("templateId") as string) ?? "";

    await deleteTemplateForUser(currentSession.user.id, {
      templateId,
      leagueId,
    });

    revalidatePath(`/league/${leagueId}/templates`);
  }

  return (
    <div className="grid gap-6">
      <Card className="grid gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-600">
          Templates
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {league.name} templates
        </h1>
        <p className="text-sm text-slate-600">
          Create reusable templates for events, announcements, registration
          forms, and volunteer opportunities. Templates pre-fill forms so you
          don't rebuild common items from scratch.
        </p>
      </Card>

      <Card className="grid gap-4">
        <h2 className="text-lg font-semibold">Create template</h2>
        <form
          action={createAction}
          aria-label="Create new template"
          className="grid gap-3 sm:grid-cols-2"
        >
          <div className="grid gap-2 text-sm font-medium text-slate-700">
            <label htmlFor="template-type">Type</label>
            <select
              aria-describedby="template-type-help"
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              id="template-type"
              name="type"
            >
              {Object.entries(templateTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500" id="template-type-help">
              What kind of item will this template create?
            </p>
          </div>
          <div className="grid gap-2 text-sm font-medium text-slate-700">
            <label htmlFor="template-name">Name</label>
            <Input
              id="template-name"
              maxLength={200}
              name="name"
              placeholder="e.g., Weekly Practice"
              required
            />
          </div>
          <div className="grid gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
            <label htmlFor="template-description">Description (optional)</label>
            <Input
              id="template-description"
              maxLength={500}
              name="description"
              placeholder="Brief description of what this template is for"
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">Create template</Button>
          </div>
        </form>
      </Card>

      {Object.entries(groupedTemplates).map(([type, items]) => (
        <Card className="grid gap-4" key={type}>
          <h2 className="text-lg font-semibold">
            {templateTypeLabels[type as TemplateType]}
          </h2>
          <ul
            aria-label={`${templateTypeLabels[type as TemplateType]} templates`}
            className="grid gap-3"
          >
            {items.map((template) => (
              <li
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
                key={template.id}
              >
                <div>
                  <p className="font-medium text-slate-900">{template.name}</p>
                  {template.payload.description ? (
                    <p className="mt-1 text-sm text-slate-500">
                      {template.payload.description}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {template.isBuiltIn ? (
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-700">
                        Built-in
                      </span>
                    ) : null}
                    {template.teamId ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                        Team-level
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        League-level
                      </span>
                    )}
                  </div>
                </div>
                <form action={deleteAction}>
                  <input name="templateId" type="hidden" value={template.id} />
                  <Button size="sm" type="submit" variant="ghost">
                    Delete
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        </Card>
      ))}

      {allTemplates.length === 0 ? (
        <Card className="grid gap-3">
          <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-600">
            No templates yet. Create your first template above, or starter
            templates will be available when your league is set up.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
