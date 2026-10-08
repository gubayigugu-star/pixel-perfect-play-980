import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function run<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      message: z.string().min(1).max(8000),
      type: z.string().max(60),
      tone: z.string().max(60),
      length: z.string().max(30),
      current: z.string().max(12000).optional(),
      instruction: z.string().max(1000).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { callAI } = await import("./ai.server");
    return run(async () => {
      const raw = await callAI({
        instructions:
          "You write clear, natural, context-appropriate emails. Never invent facts, names, dates, numbers or commitments that the user did not provide — use [placeholders] instead. Return JSON with subject and body (plain text, with line breaks, include greeting and sign-off).",
        input: data.current
          ? `Existing email:\n${data.current}\n\nImprove it: ${data.instruction || "make it clearer and more polished"}. Keep type: ${data.type}, tone: ${data.tone}, length: ${data.length}.`
          : `Email type: ${data.type}\nTone: ${data.tone}\nLength: ${data.length}\n\nWhat I want to say:\n${data.message}`,
        schema: {
          name: "email",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["subject", "body"],
            properties: { subject: { type: "string" }, body: { type: "string" } },
          },
        },
      });
      return JSON.parse(raw) as { subject: string; body: string };
    });
  });

const taskSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "priority", "deadlineDay", "estimateHours", "dependsOn", "subtasks"],
  properties: {
    title: { type: "string" },
    priority: { type: "string", enum: ["high", "medium", "low"] },
    deadlineDay: { type: "number" },
    estimateHours: { type: "number" },
    dependsOn: { type: "array", items: { type: "string" } },
    subtasks: { type: "array", items: { type: "string" } },
  },
};

export type PlanResult = {
  goal: string;
  milestones: {
    title: string;
    tasks: {
      title: string;
      priority: "high" | "medium" | "low";
      deadlineDay: number;
      estimateHours: number;
      dependsOn: string[];
      subtasks: string[];
    }[];
  }[];
};

export const planGoal = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ goal: z.string().min(1).max(8000) }).parse(d))
  .handler(async ({ data }) => {
    const { callAI } = await import("./ai.server");
    return run(async () => {
      const raw = await callAI({
        instructions:
          "You are a pragmatic project planner. Turn the goal into 3-5 milestones, each with 2-5 concrete tasks. deadlineDay = days from today the task should be done. dependsOn lists exact titles of earlier tasks. 1-4 short subtasks each. Keep titles short.",
        input: data.goal,
        effort: "medium",
        schema: {
          name: "plan",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["goal", "milestones"],
            properties: {
              goal: { type: "string" },
              milestones: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["title", "tasks"],
                  properties: { title: { type: "string" }, tasks: { type: "array", items: taskSchema } },
                },
              },
            },
          },
        },
      });
      return JSON.parse(raw) as PlanResult;
    });
  });

export const research = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ question: z.string().min(1).max(8000), depth: z.string().max(30), format: z.string().max(40) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { callAI } = await import("./ai.server");
    return run(() =>
      callAI({
        instructions: `You are a careful research assistant. Answer in Markdown with these sections as ## headings: Executive summary, Key findings, Detailed analysis, Relevant data, Limitations & uncertainties, Sources. Depth: ${data.depth}. Output style: ${data.format}. Only cite sources you are confident exist (well-known publications, organisations, official sites); say clearly when information may be outdated or uncertain. Never fabricate statistics.`,
        input: data.question,
        effort: data.depth === "Deep" ? "high" : "medium",
      }),
    );
  });

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ prompt: z.string().min(1).max(8000) }).parse(d))
  .handler(async ({ data }) => {
    const { callAI } = await import("./ai.server");
    return run(() =>
      callAI({
        instructions:
          "You are FlowAI, a concise productivity assistant. Answer helpfully in short Markdown. If the request is best served by the Email Generator, Task Planner or Research Assistant, mention it.",
        input: data.prompt,
      }),
    );
  });
