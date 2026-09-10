import { NextResponse } from 'next/server';
import * as repo from '@/lib/db/repo';
import { checkComment } from '@/lib/safety';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const recipeId = Number(searchParams.get('recipe_id') || 0);
  const storyId = Number(searchParams.get('story_id') || 0);
  if (recipeId) return NextResponse.json(await repo.listVisibleComments('recipe', recipeId));
  if (storyId) return NextResponse.json(await repo.listVisibleComments('story', storyId));
  return NextResponse.json({ error: 'Pass recipe_id or story_id' }, { status: 400 });
}

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Not a valid note' }, { status: 400 });
  }
  const recipeId = body.recipe_id ? Number(body.recipe_id) : undefined;
  const storyId = body.story_id ? Number(body.story_id) : undefined;
  const name = String(body.name || '').trim() || 'a friend of the kitchen';
  const message = String(body.message || '').trim();

  if (!recipeId && !storyId) return NextResponse.json({ error: 'Pick a recipe or story first' }, { status: 400 });
  if (!message || message.length < 2) return NextResponse.json({ error: 'Write a few words first' }, { status: 400 });
  if (message.length > 1200) return NextResponse.json({ error: 'A little too long for a note' }, { status: 400 });

  const check = checkComment(message);
  const status = check.clean ? 'visible' : 'hidden';

  const id = await repo.addComment({ recipe_id: recipeId, story_id: storyId, name, message, status });
  return NextResponse.json({
    ok: true,
    id,
    visible: status === 'visible',
    ...(status !== 'visible'
      ? { note: 'Your note is with the Seeker for a quick, gentle look before it goes on the wall.' }
      : {}),
  });
}
