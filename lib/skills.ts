/**
 * Pre-built AI skills for the automation control center.
 * Every skill runs on your own Ollama (free, private).
 * Skills can read/write the database (they create drafts, save pins, SEO…).
 */
import { ollamaChat, parseJson } from './ollama';
import * as repo from './db/repo';
import { slugify, splitMoods, MOODS } from './utils';

export interface SkillParam {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number';
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  default?: string;
  help?: string;
}

export interface SkillRunCtx {
  log: (msg: string) => void;
}

export interface SkillDef {
  id: string;
  name: string;
  emoji: string;
  category: 'writing' | 'publishing' | 'marketing';
  description: string;
  params: SkillParam[];
  savesTo: string;
  run: (input: Record<string, string>, ctx: SkillRunCtx) => Promise<{ summary: string; data?: any }>;
}

const recipeChoice: SkillParam = {
  key: 'recipe_id',
  label: 'Recipe',
  type: 'select',
  required: true,
  placeholder: 'Choose a recipe',
};

async function requireRecipe(id: string, ctx: SkillRunCtx) {
  const r = await repo.getRecipeById(Number(id));
  if (!r) throw new Error(`Recipe #${id} was not found.`);
  ctx.log(`Loaded recipe "${r.title}"`);
  return r;
}

const recentRecipesContext = async () => {
  const recs = await repo.listRecipes({ status: 'published', limit: 6 });
  return recs
    .map((r) => `• ${r.title} — ${r.kitchen_note || 'no note'} (about ${r.time_min} min, moods: ${r.moods})`)
    .join('\n') || '• (no published recipes yet)';
};

export const SKILLS: SkillDef[] = [
  {
    id: 'recipe_writer',
    name: 'Recipe Writer',
    emoji: '📖',
    category: 'writing',
    description: 'Turns a dish name and a few ingredients into a full, publish-ready recipe card (note, ingredients, steps) — saved as a draft you can polish.',
    savesTo: 'Draft recipe',
    params: [
      { key: 'title', label: 'Dish name', type: 'text', required: true, placeholder: 'e.g. Lemon Ricotta Pancakes' },
      { key: 'main_ingredients', label: 'Main ingredients', type: 'textarea', placeholder: 'lemon, ricotta, eggs, olive oil…', help: 'What this recipe is really about.' },
      { key: 'mood', label: 'Mood', type: 'select', default: 'cozy', options: MOODS.map((m) => ({ value: m.id, label: `${m.emoji} ${m.label}` })) },
      {
        key: 'tone', label: 'Tone', type: 'select', default: 'warm and unhurried, like a friend calling you from the next kitchen',
        options: [
          { value: 'warm and unhurried, like a friend calling you from the next kitchen', label: 'Warm & unhurried' },
          { value: 'playful and a little chaotic, a home cook who laughs at her own mistakes', label: 'Playful & real' },
          { value: 'calm, simple, minimal words — the recipe does the talking', label: 'Calm & minimal' },
        ],
      },
    ],
    async run(input, ctx) {
      const mood = input.mood || 'cozy';
      const json = await ollamaChat({
        json: true,
        maxTokens: 2200,
        user: `Write one complete recipe card for: "${input.title}". Main ingredients that matter: ${input.main_ingredients || 'your choice'}. Mood: ${mood}. Tone: ${input.tone}.

Return JSON exactly like:
{"title":"...","kitchen_note":"2-4 warm sentences, first person, why this dish exists, a tiny memory or feeling — no clichés","time_min":number,"servings":number,"difficulty":"easy|medium","moods":["${mood}", "one more fitting mood from: cozy, quick, family, light, sweet"],"ingredients":[{"item":"flour","amount":"2 cups","note":"(optional) a gentle tip"}] (8-14 items),"steps":["..."] (6-10 steps, each 1-2 sentences, specific amounts and doneness cues)}`,
      });
      const data = parseJson<any>(json);
      if (!data || !data.title || !Array.isArray(data.steps)) throw new Error('The model returned something I could not read as a recipe. Please try again.');
      const moods = Array.from(new Set([mood, ...(Array.isArray(data.moods) ? data.moods : [])])).filter((m) => MOODS.some((x) => x.id === m)).join(', ');
      ctx.log('Draft recipe generated — saving…');
      const id = await repo.createRecipe({
        slug: slugify(data.title),
        title: data.title,
        kitchen_note: data.kitchen_note || '',
        moods,
        time_min: Number(data.time_min) || 30,
        servings: Number(data.servings) || 4,
        difficulty: data.difficulty || 'easy',
        ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
        steps: data.steps,
        status: 'draft',
      });
      ctx.log(`Saved as draft recipe #${id}`);
      return { summary: `Draft recipe "${data.title}" created — finish it in Content → Recipes.`, data: { recipe_id: id, title: data.title } };
    },
  },
  {
    id: 'blog_writer',
    name: 'Blog Writer',
    emoji: '✍️',
    category: 'writing',
    description: 'Writes a journal story from a recipe (or a topic) in the voice of the kitchen — saved as a draft story.',
    savesTo: 'Draft story',
    params: [
      { key: 'recipe_id', label: 'From recipe (optional)', type: 'select', placeholder: '— or write from a topic below' },
      { key: 'topic', label: 'Or a topic', type: 'text', placeholder: 'e.g. why I stopped chasing "perfect" bread' },
      { key: 'angle', label: 'Angle (optional)', type: 'text', placeholder: 'what should the reader feel by the end?' },
    ],
    async run(input, ctx) {
      let about = input.topic || '';
      let recipe: any = null;
      if (input.recipe_id) {
        recipe = await requireRecipe(input.recipe_id, ctx);
        about = `This story is about the recipe "${recipe.title}": ${recipe.kitchen_note || ''} Ingredients: ${(JSON.parse(recipe.ingredients || '[]') || []).map((i: any) => i.item).join(', ')}.`;
      }
      if (!about.trim()) throw new Error('Pick a recipe or give me a topic to write about.');
      const json = await ollamaChat({
        json: true,
        maxTokens: 2400,
        user: `Write a journal story for the "Notes from the counter" section of TherecipeSeeker. ${about} ${input.angle ? `Angle: ${input.angle}` : ''}

Voice: a woman writing in her own kitchen notebook — honest, warm, a little funny, specific details (smells, sounds, the dog, the clock). 500-800 words. NOT a blog post: no "In today's post…", no listicles, no marketing.

Return JSON exactly like:
{"title":"short, human, no clickbait (5-9 words)","excerpt":"1-2 sentences, the hook","body":"markdown: paragraphs separated by blank lines, ## for 1-2 subheads, - for short lists only if natural, **bold** for a phrase or two"}`,
      });
      const data = parseJson<any>(json);
      if (!data || !data.title || !data.body) throw new Error('The model returned something I could not read as a story. Please try again.');
      const id = await repo.createStory({
        slug: slugify(data.title),
        title: data.title,
        excerpt: data.excerpt || '',
        body: data.body,
        tag: 'notes',
        status: 'draft',
      });
      ctx.log(`Saved as draft story #${id}`);
      return { summary: `Draft story "${data.title}" created — find it in Content → Stories.`, data: { story_id: id, title: data.title } };
    },
  },
  {
    id: 'pin_captions',
    name: 'Pinterest Pins',
    emoji: '📌',
    category: 'marketing',
    description: 'Writes 10 pin-ready captions + hashtags for a recipe (the thing that feeds your 68k monthly views) — saved on the recipe.',
    savesTo: 'Recipe → pins',
    params: [recipeChoice],
    async run(input, ctx) {
      const r = await requireRecipe(input.recipe_id, ctx);
      const ing = (JSON.parse(r.ingredients || '[]') || []).map((i: any) => i.item).join(', ');
      const json = await ollamaChat({
        json: true,
        maxTokens: 1600,
        user: `For this recipe from TherecipeSeeker (a warm recipe home for women): "${r.title}" — ${r.kitchen_note || ''} Main ingredients: ${ing}. About ${r.time_min} minutes.

Write 10 Pinterest pin captions. Mix: some short & cozy (under 60 chars), some with a soft hook, none clickbaity, none using ALL CAPS. Each gets 3-5 hashtags (mix of big and niche, e.g. #comfortfood #weeknightdinner #therecipeseeker).

Return JSON exactly like:
{"pins":[{"headline":"the pin text","description":"1 sentence that would make a woman stop scrolling","hashtags":["#a","#b","#c"]}]} — 10 items.`,
      });
      const data = parseJson<any>(json);
      const pins = Array.isArray(data?.pins) ? data.pins.filter((p: any) => p.headline) : [];
      if (pins.length < 3) throw new Error('The model did not return enough pin captions. Please try again.');
      await repo.updateRecipe(Number(r.id), { pins });
      ctx.log(`Saved ${pins.length} pins on "${r.title}"`);
      return { summary: `${pins.length} pin captions saved on "${r.title}".`, data: { recipe_id: r.id, pins } };
    },
  },
  {
    id: 'seo_polish',
    name: 'SEO Polish',
    emoji: '🔍',
    category: 'marketing',
    description: 'Writes a human search title (≤60 chars) and meta description (≤155) for a recipe or story — saved on it.',
    savesTo: 'Recipe/Story → SEO',
    params: [
      { key: 'recipe_id', label: 'Recipe', type: 'select', placeholder: 'Choose a recipe (or a story)' },
      { key: 'story_id', label: 'Or story', type: 'select', placeholder: 'Choose a story' },
    ],
    async run(input, ctx) {
      let target: any = null;
      let kind = 'recipe';
      if (input.recipe_id) { target = await requireRecipe(input.recipe_id, ctx); }
      else if (input.story_id) {
        const s = await repo.getStoryById(Number(input.story_id));
        if (!s) throw new Error(`Story #${input.story_id} was not found.`);
        target = s; kind = 'story';
      } else throw new Error('Pick a recipe or a story to polish.');
      const json = await ollamaChat({
        json: true,
        maxTokens: 300,
        user: `Write SEO metadata for this ${kind} from TherecipeSeeker (a warm recipe home for women, no clickbait, feels like a friend):
Title: ${target.title}
${kind === 'recipe' ? `Note: ${target.kitchen_note}` : `Excerpt: ${target.excerpt}`}

Return JSON exactly like: {"seo_title":"<=60 chars, includes the dish/topic naturally","seo_description":"<=155 chars, warm, one concrete detail, ends with an invitation (no "click here")}`,
      });
      const data = parseJson<any>(json);
      if (!data?.seo_title || !data?.seo_description) throw new Error('The model did not return SEO text. Please try again.');
      if (kind === 'recipe') await repo.updateRecipe(Number(target.id), { seo_title: data.seo_title, seo_description: data.seo_description });
      else await repo.updateStory(Number(target.id), { seo_title: data.seo_title, seo_description: data.seo_description });
      ctx.log(`SEO saved on ${kind} "${target.title}"`);
      return { summary: `SEO saved: “${data.seo_title}”`, data: { seo: data } };
    },
  },
  {
    id: 'newsletter_draft',
    name: 'Sunday Letter',
    emoji: '💌',
    category: 'writing',
    description: 'Drafts "The Sunday Spoon" — a short, warm weekly letter around your latest recipes. You review it before anyone gets it.',
    savesTo: 'Job output (review in Automation)',
    params: [
      { key: 'topic', label: 'Theme (optional)', type: 'text', placeholder: 'e.g. one-pot Sundays, or leave empty to use your latest recipes' },
    ],
    async run(input, ctx) {
      const recent = await recentRecipesContext();
      ctx.log(`Used ${recent.split('\n').length} recent recipes as context`);
      const json = await ollamaChat({
        json: true,
        maxTokens: 2000,
        user: `Draft this week's email "The Sunday Spoon" from TherecipeSeeker to its home cooks.
${input.topic ? `Theme: ${input.topic}.` : 'Use the latest recipes as the spine of the letter.'}
Recent recipes:
${recent}

Rules: 250-400 words total. Opens with 1-2 lines that feel like a real person texting you ("hey, this week was…"). Then the letter: the 1-2 recipes to make this weekend and exactly why, one small kitchen tip or honest mistake from the week, one line that makes them feel seen. Ends with "see you at the stove — S". No subject-line clickbait, no "Don't miss!", no links.

Return JSON exactly like:
{"subject":"<= 55 chars, lowercase-friendly, human","preview":"the little preview text (<= 90 chars)","body":"plain text of the letter, paragraphs separated by blank lines"}`,
      });
      const data = parseJson<any>(json);
      if (!data?.subject || !data?.body) throw new Error('The model did not return a letter. Please try again.');
      ctx.log(`Letter drafted: "${data.subject}"`);
      return { summary: `Letter drafted — "${data.subject}". Review it below, then send it from Newsletter.`, data: { subject: data.subject, preview: data.preview, body: data.body } };
    },
  },
  {
    id: 'kitchen_tips',
    name: 'Kitchen Tips',
    emoji: '🧂',
    category: 'writing',
    description: 'Writes 5 real, specific "from experience" tips for a recipe — saved on the recipe card.',
    savesTo: 'Recipe → tips',
    params: [recipeChoice],
    async run(input, ctx) {
      const r = await requireRecipe(input.recipe_id, ctx);
      const ing = (JSON.parse(r.ingredients || '[]') || []).map((i: any) => i.item).join(', ');
      const json = await ollamaChat({
        json: true,
        maxTokens: 900,
        user: `For the recipe "${r.title}" (ingredients: ${ing}), write 5 kitchen tips the way a friend who has made it many times would tell them — specific (temperatures, texture cues, substitutions, rescue moves), each 1-2 sentences, none generic ("cook to your liking").

Return JSON exactly like: {"tips":["tip 1","tip 2","tip 3","tip 4","tip 5"]}`,
      });
      const data = parseJson<any>(json);
      const tips = Array.isArray(data?.tips) ? data.tips.filter(Boolean).slice(0, 8) : [];
      if (tips.length < 3) throw new Error('The model did not return enough tips. Please try again.');
      const existing: string[] = JSON.parse(r.tips || '[]') || [];
      await repo.updateRecipe(Number(r.id), { tips: [...existing, ...tips] });
      ctx.log(`Saved ${tips.length} tips on "${r.title}"`);
      return { summary: `${tips.length} tips saved on "${r.title}".`, data: { recipe_id: r.id, tips } };
    },
  },
];

export function getSkill(id: string): SkillDef | undefined {
  return SKILLS.find((s) => s.id === id);
}

export async function runSkill(skillId: string, input: Record<string, string>, context: any, onLog?: (msg: string) => void): Promise<{ summary: string; data?: any }> {
  const skill = getSkill(skillId);
  if (!skill) throw new Error(`Unknown skill "${skillId}"`);
  const logs: string[] = [];
  const log = (m: string) => { logs.push(m); onLog?.(m); };
  return skill.run(input, { log });
}
