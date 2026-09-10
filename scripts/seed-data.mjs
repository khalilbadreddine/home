/**
 * Starter content for TherecipeSeeker.
 * These are real, complete recipes & a real story — not mock data.
 * Edit or delete them from the dashboard the moment you want to.
 */

export const RECIPES = [
  {
    slug: 'honey-oat-pancakes',
    title: 'Honey Oat Pancakes',
    kitchen_note:
      'The morning I stopped measuring my pancakes and started drizzling them was the best breakfast decision of the year. Oats make them tender and honey does the rest — no buttermilk required, no fuss, no guilt.',
    moods: 'cozy,sweet',
    time_min: 25,
    servings: 4,
    difficulty: 'easy',
    image: '/images/recipes/pancakes.jpg',
    ingredients: [
      { item: 'All-purpose flour', amount: '1½ cups', note: '' },
      { item: 'Oat flour', amount: '½ cup', note: 'or rolled oats pulsed fine' },
      { item: 'Baking powder', amount: '2 tsp', note: '' },
      { item: 'Salt', amount: 'a pinch', note: '' },
      { item: 'Whole milk', amount: '1¼ cups', note: '' },
      { item: 'Egg', amount: '1', note: '' },
      { item: 'Honey', amount: '3 tbsp + more to drizzle', note: 'whatever honey you love' },
      { item: 'Butter, melted', amount: '2 tbsp', note: '' },
      { item: 'Butter or neutral oil', amount: 'as needed', note: 'for the pan' },
      { item: 'Berries or warm maple syrup', amount: 'to serve', note: 'optional but encouraged' },
    ],
    steps: [
      'Whisk the flour, oat flour, baking powder, and salt together in a big bowl.',
      'In a second bowl, stir the milk, egg, honey, and melted butter until just combined.',
      'Pour the wet into the dry and stir until no dry streaks remain — a few lumps are your friend, not your enemy.',
      'Let the batter rest 10 minutes. It will thicken. That is normal, not a mistake.',
      'Heat a non-stick pan over medium-low. When a drop of water dances, it is ready.',
      'Ladle ¼-cup mounds of batter. Cook 2–3 minutes until bubbles open and hold, flip, and cook 1–2 more minutes until deeply golden.',
      'Stack them high, top with a warm knob of butter, and drizzle more honey. Eat the stack from the side — I am not checking on you.',
    ],
    pins: [],
    tips: [
      'The 10-minute rest is not optional — it is what makes the pancakes tender instead of chewy.',
      'Medium-low heat is the whole game. A screaming pan gives you dark edges and a raw center.',
      'Swap half the milk for Greek yogurt for a fluffier, tangier stack.',
    ],
    status: 'published',
  },
  {
    slug: 'sunday-tomato-basil-soup',
    title: 'Sunday Tomato & Basil Soup',
    kitchen_note:
      'This is the soup that makes my kitchen smell like summer in January. It is better the next day and freezes beautifully — make a big pot, warm a small pot of bread, and thank your future self.',
    moods: 'cozy,light,family',
    time_min: 40,
    servings: 6,
    difficulty: 'easy',
    image: '/images/recipes/tomato-soup.jpg',
    ingredients: [
      { item: 'Olive oil', amount: '3 tbsp', note: 'the good one' },
      { item: 'Yellow onion', amount: '1, diced', note: '' },
      { item: 'Carrots', amount: '2, sliced', note: '' },
      { item: 'Celery', amount: '2 stalks, sliced', note: '' },
      { item: 'Garlic', amount: '4 cloves, minced', note: '' },
      { item: 'San Marzano tomatoes', amount: '2 cans (28 oz)', note: 'crushed by hand' },
      { item: 'Vegetable or chicken stock', amount: '3 cups', note: 'low-sodium if you can' },
      { item: 'Sugar', amount: '1 tsp', note: 'only if the tomatoes taste sour' },
      { item: 'Fresh basil', amount: 'a big handful + more to serve', note: '' },
      { item: 'Heavy cream', amount: '⅓ cup', note: 'or a splash of whole milk' },
      { item: 'Day-old bread', amount: 'for crostini', note: 'optional but encouraged' },
      { item: 'Salt & black pepper', amount: 'to taste', note: 'boldly' },
    ],
    steps: [
      'Warm the olive oil in a big pot over medium. Sweat the onion, carrot, and celery until soft, about 8 minutes — this is where the sweetness comes from.',
      'Stir in the garlic and cook 1 minute until the kitchen announces it.',
      'Crush the tomatoes by hand straight into the pot. Yes, by hand. It is more fun than stirring.',
      'Add the stock and the sugar (if needed). Bring to a simmer.',
      'Simmer partly covered for 20 minutes, until the vegetables give up their shape.',
      'Stir in the cream and most of the basil. Season boldly — soup that sits around needs salt.',
      'Taste, adjust, and serve in your warmest bowls with crostini on top. If you have basil flowers, this is the moment.',
    ],
    pins: [],
    tips: [
      'Blending it silky is optional — a slightly chunky soup feels more like a home kitchen.',
      'A spoonful of pesto stirred in at the end is a shortcut to a bigger pot of basil.',
      'Freeze it in mason jars, leaving 2 cm of headroom. Lunch will never be boring again.',
    ],
    status: 'published',
  },
  {
    slug: 'one-pot-lemon-garlic-chicken',
    title: 'One-Pot Lemon Garlic Chicken',
    kitchen_note:
      'One pot, thirty-five minutes, and a table that fills up. This is my answer to every "what\'s for dinner?" this year — the potatoes soak up all the lemon and the skin gets properly golden.',
    moods: 'quick,family',
    time_min: 35,
    servings: 4,
    difficulty: 'easy',
    image: '/images/recipes/lemon-chicken.jpg',
    ingredients: [
      { item: 'Chicken thighs, bone-in skin-on', amount: '6 (about 2 lb)', note: 'thighs, always thighs' },
      { item: 'Olive oil', amount: '2 tbsp', note: '' },
      { item: 'Garlic', amount: '6 cloves, smashed', note: '' },
      { item: 'Yellow onion', amount: '1, half-moons', note: '' },
      { item: 'Baby potatoes', amount: '2 lb, halved', note: 'waxy ones if you find them' },
      { item: 'Lemon', amount: '1 (half sliced, half juiced)', note: '' },
      { item: 'Dried oregano', amount: '1½ tsp', note: '' },
      { item: 'Chicken stock', amount: '¾ cup', note: '' },
      { item: 'Fresh parsley', amount: 'a handful, chopped', note: '' },
      { item: 'Salt & black pepper', amount: 'generous', note: '' },
    ],
    steps: [
      'Heat the oil in a Dutch oven or deep skillet over medium-high. Season the thighs well, on both sides.',
      'Sear skin-side down 4–5 minutes, undisturbed — this is the flavor, do not rush it. Flip and brown the other side briefly.',
      'Push the chicken to the edges. Toss in the garlic and onion; cook 2 minutes.',
      'Nestle in the potatoes, oregano, and lemon slices. Add the stock and bring to a simmer.',
      'Cover and cook 18–20 minutes, until the potatoes yield to a fork and the chicken hits 165°F in the thickest part.',
      'Shake the pot gently, squeeze in the juice of the remaining lemon half, and shower with parsley. Eat straight from the pot if you want — no judgment here.',
    ],
    pins: [],
    tips: [
      'Dry the chicken with paper towels before searing — that is 90% of a good skin.',
      'Swapped lemons for limes? It works, and it tastes like a beach somewhere far away.',
      'The next day, the potatoes in the same pot make the best fried potatoes of your life.',
    ],
    status: 'published',
  },
  {
    slug: 'warm-chocolate-date-cookies',
    title: 'Warm Chocolate Date Cookies',
    kitchen_note:
      'I found this in a 1970s cookbook that smelled like cinnamon. Three ingredients and it somehow tastes like the best version of dessert. It is not for sharing. (Share it.)',
    moods: 'sweet,cozy',
    time_min: 30,
    servings: 24,
    difficulty: 'easy',
    image: '/images/recipes/date-cookies.jpg',
    ingredients: [
      { item: 'Medjool dates', amount: '1½ cups, pitted & chopped', note: 'the sticky, jammy ones' },
      { item: 'Buttery shortbread cookies', amount: '12', note: 'store-bought is fine here' },
      { item: 'Dark chocolate', amount: '1 cup, chopped', note: '60–70% if you like' },
      { item: 'Unsalted butter', amount: '⅓ cup', note: '' },
      { item: 'Flaky salt', amount: 'a pinch', note: 'non-negotiable' },
      { item: 'Coffee or tea', amount: 'for dunking', note: 'unlimited' },
    ],
    steps: [
      'Place the dates, cookies, and chocolate in a microwave-safe bowl (or a small saucepan over very low heat).',
      'Melt for 1 minute, stirring halfway. Let it sit 2 minutes — it will look not-quite-melted. That is a lie. Stir.',
      'Stir in the butter until you have a glossy, slightly chunky pudding.',
      'Spoon small mounds onto a plate lined with parchment. They hold their shape but stay molten in the middle.',
      'Flaky salt on top. Eat within 10 minutes — that is the rule, and the rule is right.',
    ],
    pins: [],
    tips: [
      'Crunched cookies in the middle of the bowl make the best part — leave a few pieces to crumble in by hand.',
      'A splash of espresso stirred into the melted chocolate is a secret weapon.',
      'Serve in little warm bowls like it is soup, because it is basically soup for your heart.',
    ],
    status: 'published',
  },
];

export const STORIES = [
  {
    slug: 'why-i-started-therecipeseeker',
    title: 'Why I started TherecipeSeeker',
    excerpt:
      'It began with a jar of jam, a cold kitchen, and the quiet realization that most recipe websites feel like instructions — not like home.',
    tag: 'notes',
    image: '/images/hero-kitchen.jpg',
    status: 'published',
    body: `### It began with a jar of jam

Nobody warns you that missing a kitchen is a specific kind of lonely. I had moved away from the one I grew up in, and for months I could not cook. Not because I did not know how — because every recipe I opened felt like a contract. *Preheat to 180. Fold until glossy. Do not overmix.* Precise, efficient, and completely unlike the woman whose hands taught me to cook in the first place.

Her kitchen had no measurements. It had a wooden spoon that had lost a chunk to the edge of a pot. It had "a little more salt, taste it." It had music too loud to think and a radio that skipped.

### What I wanted to build

So This is what I have been trying to make since: a place where recipes feel like a note from a friend who loves you. Not a database. Not a feed optimized for your attention. A kitchen.

Every recipe here starts with a *why* before it starts with a *how* — why this dish exists, what it tastes like on a Tuesday, what to do when it goes slightly wrong (it will; I want you to know that in advance and be gentle with it).

And the moods — Cozy, Quick, Feeding a Crowd — are not a filter trick. They are how I actually cook. I do not decide "I will make pasta tonight." I decide *how my kitchen is tonight*, and the food follows.

### A promise about this place

I built The Circle because the internet can be loud and mean, and cooking is one of the few places that does not have to be. Here, the ground rules are small and kind: we leave the world at the door, we share the way we would share a recipe card — messy handwriting and all, and no one is ever graded on their kitchen.

Eleven thousand of you have already pinned something from here. Sixty-eight thousand of you visit every month. I still read every single comment, and I still get a little floaty when one of you tells me the soup made a house smell like home.

Stay a while. The kettle is on.`,
  },
];

export const SETTINGS = {
  site_name: 'TherecipeSeeker',
  tagline: 'A kitchen on the internet, for you.',
  hero_title: 'Tonight, let’s make something kind to yourself.',
  hero_sub: 'TherecipeSeeker is a small corner of the internet that feels like home — real recipes with a why before the how, a pantry that cooks with what you already have, and a circle of women who leave the world at the door.',
  followers_note: '11k friends on Pinterest · 68k visits every month',
  pinterest_url: 'https://www.pinterest.com/therecipeseeker',
  instagram_url: '',
  ollama_url: '',
  ollama_model: '',
  resend_api_key: '',
  newsletter_from: 'The Sunday Spoon <hello@therecipeseeker.com>',
  circle_rules: 'Leave the world at the door — this is for cooking, not for news.\nShare like you would pass a recipe card: messily, warmly, no grades.\nIf a dish failed, say so. We all have a "what went wrong" shelf.\nNo one is ever called out. Ever.\nIf something hurts you here, tell the Seeker — it gets read by a human.',
};

export const WORKFLOWS = [
  {
    name: 'New recipe → set the table',
    description: 'Whenever you publish a recipe: write its SEO, generate 10 Pinterest pin captions, and draft 5 kitchen tips — automatically.',
    trigger: 'recipe_published',
    active: true,
    schedule_hours: null,
    steps: [
      { skill: 'seo_polish', input: { recipe_id: '{{recipe.id}}' } },
      { skill: 'pin_captions', input: { recipe_id: '{{recipe.id}}' } },
      { skill: 'kitchen_tips', input: { recipe_id: '{{recipe.id}}' } },
    ],
  },
  {
    name: 'New story → polish it',
    description: 'Whenever you publish a journal story: write its SEO title and description.',
    trigger: 'story_published',
    active: true,
    schedule_hours: null,
    steps: [{ skill: 'seo_polish', input: { story_id: '{{story.id}}' } }],
  },
  {
    name: 'The Sunday Spoon (weekly)',
    description: 'Every week, draft the newsletter around your latest recipes. It never sends itself — you review and press send.',
    trigger: 'schedule',
    active: true,
    schedule_hours: 168,
    steps: [{ skill: 'newsletter_draft', input: {} }],
  },
  {
    name: 'Quick: write a recipe from scratch',
    description: 'Manual. Give it a dish name and a few ingredients; it writes the whole recipe card as a draft.',
    trigger: 'manual',
    active: true,
    schedule_hours: null,
    steps: [
      {
        skill: 'recipe_writer',
        input: {
          title: '{{input.title}}',
          main_ingredients: '{{input.main_ingredients}}',
          mood: '{{input.mood}}',
          tone: '{{input.tone}}',
        },
      },
    ],
  },
];
