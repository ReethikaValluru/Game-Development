import {
  GameResources,
  HistoricalEra,
  HistoricalDilemma,
  DiscoveryTech,
  CodexEntry,
  Quest,
  DilemmaChoice,
} from '../types/game';

export const INITIAL_RESOURCES: GameResources = {
  population: 45,
  dunbarLimit: 150,
  mythPower: 20,
  calories: 200,
  flintAndStone: 60,
  knowledge: 15,
};

export const HISTORICAL_DILEMMAS: HistoricalDilemma[] = [
  {
    id: 'gossip_vs_foraging',
    era: 'cognitive',
    title: 'The Gossip Revolution vs. Pure Foraging',
    historicalContext:
      'Sociable primates use grooming to maintain intimacy. But as bands grow, grooming takes too much daylight. Sapiens invented a new social technology: talking behind each others backs.',
    bookQuote:
      'The Gossip Theory sounds like a joke, but numerous studies support it. Even today the vast majority of human communication is gossip.',
    chapterRef: 'Chapter 2: The Tree of Knowledge',
    choices: [
      {
        id: 'encourage_gossip',
        label: 'Embrace Tribal Gossip & Social Alliances',
        description: 'Spend foraging hours talking about band relationships, reliable hunters, and trustworthiness.',
        harariTheory: 'Social chatter builds social cohesion and trust without physical grooming, allowing band expansion.',
        effects: {
          mythPower: 30,
          dunbarLimit: 50,
          calories: -30,
          knowledge: 20
        }
      },
      {
        id: 'maximize_foraging',
        label: 'Focus Strictly on Roots & Game Gathering',
        description: 'Silence the campfire chatter. Every daylight minute must be spent hunting and harvesting.',
        harariTheory: 'Short-term caloric surplus at the expense of fragile band bonding.',
        effects: {
          calories: 120,
          flintAndStone: 40,
          mythPower: -10,
          dunbarLimit: -20
        }
      }
    ]
  },
  {
    id: 'lion_man_stadel',
    era: 'cognitive',
    title: 'Carving the Stadel Lion-Man',
    historicalContext:
      'In a German cave (Hohlenstein-Stadel), archaeologists uncovered a 40,000-year-old ivory figurine: half-human, half-lion. It is the earliest undisputed evidence of the human imagination creating things that do not physically exist.',
    bookQuote:
      'Any monkey can say, "Look! A lion! Let us run away!" But only Homo sapiens can say, "The lion is the guardian spirit of our tribe."',
    chapterRef: 'Chapter 2: The Tree of Knowledge',
    choices: [
      {
        id: 'carve_totem',
        label: 'Dedicate 400 Hours of Mammoth Ivory to Carve the Totem',
        description: 'Exempt master carvers from hunting so they can manifest the mythical guardian spirit of the clan.',
        harariTheory: 'Shared fiction enables hundreds of strangers to cooperate toward a common destiny.',
        effects: {
          mythPower: 60,
          dunbarLimit: 120,
          flintAndStone: -30,
          calories: -40,
          knowledge: 35
        },
        unlockTechId: 'shared_fiction'
      },
      {
        id: 'make_spearheads',
        label: 'Fashion Mammoth Tusks into Barbed Spear Points',
        description: 'Ivory is hard and lethal. Weaponry brings meat, not metaphysical spirits.',
        harariTheory: 'Material pragmatism strengthens physical defenses but caps large-scale cultural bonding.',
        effects: {
          flintAndStone: 60,
          calories: 80,
          knowledge: 15
        }
      }
    ]
  },
  {
    id: 'neanderthal_encounter',
    era: 'cognitive',
    title: 'Encounter with Homo Neanderthalensis in the Levant',
    historicalContext:
      'As Sapiens expanded into Eurasia, they met Neanderthals: stronger, more muscular, and well-adapted to the cold. How will Sapiens interact with another human species?',
    bookQuote:
      'The Interbreeding Theory tells a story of attraction, sex and mingling. The Replacement Theory tells a very different story—one of incompatibility, revulsion and perhaps genocide.',
    chapterRef: 'Chapter 1: An Animal of No Significance',
    choices: [
      {
        id: 'interbreed_trade',
        label: 'Trade, Interbreed & Learn Ice-Age Herbal Knowledge',
        description: 'Exchange ornaments, intermarry, and absorb Neanderthal botanical and hunting skills.',
        harariTheory: 'Modern non-African humans carry 1-2% Neanderthal DNA—proof of genetic and cultural mingling.',
        effects: {
          population: 30,
          knowledge: 45,
          mythPower: 15,
          calories: 50
        }
      },
      {
        id: 'displace_outcompete',
        label: 'Organize 100-Hunter Raids with Sapiens Language Coordination',
        description: 'Leverage our superior linguistic coordination and long-range projectile atlatls to claim territory.',
        harariTheory: 'Sapiens social density and fictitious myths allowed armies of hundreds to outcompete smaller Neanderthal bands.',
        effects: {
          calories: 140,
          flintAndStone: 70,
          population: 15,
          mythPower: 25
        }
      }
    ]
  },
  {
    id: 'luxury_trap_wheat',
    era: 'agricultural',
    title: 'The Luxury Trap: Sowing Wild Emmer Wheat',
    historicalContext:
      'Around 9500 BCE, foragers noticed wheat growing profusely around cleared hearths. Should we clear rocks, weed fields, and settle down permanently by the river?',
    bookQuote:
      'We did not domesticate wheat. Wheat domesticated us. This is the essence of the Agricultural Revolution: the capacity to keep more people alive under worse conditions.',
    chapterRef: 'Chapter 5: History\'s Biggest Fraud',
    choices: [
      {
        id: 'embrace_agriculture',
        label: 'Clear Fields, Build Mud-Brick Silos, and Settle',
        description: 'Trade the diverse forager diet for wheat porridge and grueling sun-up to sun-down hoeing.',
        harariTheory: 'Permanent cultivation causes a demographic explosion, but individual farmers suffered backaches, malnutrition, and dental decay.',
        effects: {
          population: 90,
          calories: 200,
          dunbarLimit: 250,
          mythPower: 40,
          knowledge: 50
        },
        unlockTechId: 'emmer_cultivation'
      },
      {
        id: 'remain_nomadic_foragers',
        label: 'Keep Moving with the Seasons as Proud Hunter-Gatherers',
        description: 'Work 30 hours a week foraging nuts, berries, and gazelles, enjoying rich leisure and varied health.',
        harariTheory: 'The original affluent society: foragers worked fewer hours and were less vulnerable to famine and infectious plagues.',
        effects: {
          calories: 50,
          knowledge: 30,
          mythPower: 30,
          population: 10
        }
      }
    ]
  },
  {
    id: 'code_of_hammurabi',
    era: 'agricultural',
    title: 'The Code of Hammurabi & Imagined Orders',
    historicalContext:
      'King Hammurabi of Babylon unites Mesopotamia into an empire of 1,000,000 subjects. To keep peace, he carves 282 laws in diorite, declaring gods gave him authority.',
    bookQuote:
      'An imagined order is always in danger of collapsing because it exists only in our minds. To safeguard it, continuous efforts—some violent, some educational—are required.',
    chapterRef: 'Chapter 6: Building Pyramids',
    choices: [
      {
        id: 'codify_hierarchies',
        label: 'Enshrine the Legal Code of Nobles, Commoners, and Slaves',
        description: 'Proclaim that divine gods decreed class hierarchies so millions follow uniform legal justice.',
        harariTheory: 'Imagined orders allow massive societies to cooperate peacefully, even when predicated on structural injustice.',
        effects: {
          dunbarLimit: 800,
          mythPower: 80,
          knowledge: 70,
          calories: 120
        },
        unlockTechId: 'imagined_orders'
      },
      {
        id: 'decentralized_councils',
        label: 'Rely on Autonomous Village Elders and Mutual Consent',
        description: 'Reject divine kingship and enforce egalitarian village mediation.',
        harariTheory: 'Without a pervasive shared myth backed by power, large urban confederations splinter into factions.',
        effects: {
          mythPower: 20,
          population: 20,
          knowledge: 25,
          dunbarLimit: -100
        }
      }
    ]
  },
  {
    id: 'discovery_of_ignorance',
    era: 'scientific',
    title: 'The Discovery of Ignorance ("Ignoramus")',
    historicalContext:
      'Pre-modern traditions claimed all important truths were already revealed by gods or scriptures. In 1500 CE, humanity took the revolutionary step of declaring: "We do not know."',
    bookQuote:
      'The Scientific Revolution has not been a revolution of knowledge. It has been above all a revolution of ignorance. The great discovery that launched it was that humans do not know the answers to their most important questions.',
    chapterRef: 'Chapter 14: The Discovery of Ignorance',
    choices: [
      {
        id: 'admit_ignorance_empirical',
        label: 'Fund Empirical Voyages, Blank World Maps & Laboratories',
        description: 'Print maps with empty oceans and systematically test physical phenomena with mathematics.',
        harariTheory: 'Willingness to admit ignorance catalyzed an unprecedented alliance between science, capital, and global expeditions.',
        effects: {
          knowledge: 180,
          mythPower: 50,
          calories: 100,
          dunbarLimit: 2000
        },
        unlockTechId: 'scientific_method'
      },
      {
        id: 'cling_to_dogma',
        label: 'Uphold Ancient Dogmas to Protect Moral Certainty',
        description: 'Suppress disturbing astronomical observations to preserve theological harmony and peace of mind.',
        harariTheory: 'Tradition preserves social stability at the cost of stagnation and technological vulnerability to external powers.',
        effects: {
          mythPower: 60,
          knowledge: 10,
          calories: 40
        }
      }
    ]
  }
];

export const DISCOVERY_TECHS: DiscoveryTech[] = [
  {
    id: 'tree_of_knowledge',
    era: 'cognitive',
    name: 'Tree of Knowledge Mutation',
    cost: { knowledge: 20, mythPower: 15 },
    description: 'Neurological mutation allowing flexible language to discuss things that do not exist.',
    harariInsight: 'Between 70,000 and 30,000 years ago, accidental genetic mutations rewired Sapiens brains.',
    unlocked: true,
  },
  {
    id: 'fire_mastery',
    era: 'cognitive',
    name: 'Controlled Fire & Cooking',
    cost: { knowledge: 30, flintAndStone: 25 },
    description: 'Shortened intestines, liberated energy for larger cerebral cortex, and created the campfire circle.',
    harariInsight: 'Cooking predigested food, shrinking teeth and gut while fueling a massive metabolic brain.',
    unlocked: false,
  },
  {
    id: 'shared_fiction',
    era: 'cognitive',
    name: 'Shared Myth & Totemism',
    cost: { knowledge: 45, mythPower: 40 },
    description: 'Enables cooperation between bands far exceeding Dunbar’s physical limit of 150.',
    harariInsight: 'Fiction has enabled us not merely to imagine things, but to do so collectively.',
    unlocked: false,
  },
  {
    id: 'atlatl_megafauna',
    era: 'cognitive',
    name: 'Atlatl & Megafauna Coordination',
    cost: { knowledge: 60, flintAndStone: 50 },
    description: 'Spear-throwers and coordinated ambush tactics to bring down giant mammoths.',
    harariInsight: 'Armed with cognitive planning, Sapiens drove giant Australian and American megafauna to extinction.',
    unlocked: false,
  },
  {
    id: 'emmer_cultivation',
    era: 'agricultural',
    name: 'Wheat & Grain Domestication',
    cost: { knowledge: 90, mythPower: 50 },
    description: 'Intensive manipulation of plant genetics, permanent settlements, and grain storehouses.',
    harariInsight: 'Wheat demanded 24/7 care: weeding, fertilizing, irrigating, protecting against pests.',
    unlocked: false,
  },
  {
    id: 'imagined_orders',
    era: 'agricultural',
    name: 'Imagined Orders & Legal Codes',
    cost: { knowledge: 130, mythPower: 80 },
    description: 'Universal belief in divine kings, societal castes, and shared contracts like the Code of Hammurabi.',
    harariInsight: 'Hammurabi and the American Founding Fathers both imagined an order based on universal, eternal principles.',
    unlocked: false,
  },
  {
    id: 'money_universal_trust',
    era: 'agricultural',
    name: 'Money & Financial Credit',
    cost: { knowledge: 180, mythPower: 100 },
    description: 'The most universal and efficient system of mutual trust ever created by humankind.',
    harariInsight: 'Money is the only trust system created by humans that can bridge almost any cultural gap.',
    unlocked: false,
  },
  {
    id: 'scientific_method',
    era: 'scientific',
    name: 'The Scientific Method & Ignorance',
    cost: { knowledge: 240, mythPower: 90 },
    description: 'Admitting that what we do not know exceeds what we know, tested through mathematical observation.',
    harariInsight: 'Modern science recognizes no dogma, seeks universal laws, and ties knowledge directly to power.',
    unlocked: false,
  }
];

export const CODEX_ENTRIES: CodexEntry[] = [
  {
    id: 'cognitive_revolution',
    era: 'cognitive',
    title: 'The Cognitive Revolution',
    concept: 'Mutation of the Tree of Knowledge',
    summary: 'The emergence of symbolic language between 70,000 and 30,000 years ago that allowed Sapiens to describe fictional entities.',
    harariQuote:
      'The truly unique feature of our language is not its ability to transmit information about men and lions. Rather, it is the ability to transmit information about things that do not exist at all.',
    discussion:
      'Legends, myths, gods, and religions appeared for the first time. Ants and bees can work together in huge numbers, but only with close relatives. Chimpanzees cooperate only with intimate acquaintances. Only Sapiens can cooperate in flexible ways with countless numbers of strangers.',
    keyTakeaway: 'Fiction is humanity’s superpower: large-scale cooperation rests entirely on shared myths.'
  },
  {
    id: 'dunbar_number',
    era: 'cognitive',
    title: 'Dunbar’s Number & The Myth Threshold',
    concept: 'The Biological Limit of Intimacy (~150)',
    summary: 'Anthropological observation that primate social groups cannot exceed ~150 individuals based purely on personal acquaintance and gossip.',
    harariQuote:
      'Even today, a human threshold stands around this magic number of 150. Below this threshold, communities, businesses, and military units can run on personal relationships without formal ranks.',
    discussion:
      'Once a band exceeds 150 individuals, it inevitably splinters into rival clans unless bonded by a shared narrative—a totem, an imagined common ancestor, a company mission, or a national constitution.',
    keyTakeaway: 'To lead a group of over 150, you must invent stories that everyone believes.'
  },
  {
    id: 'gossip_theory',
    era: 'cognitive',
    title: 'The Gossip Theory',
    concept: 'Social Bonding via Vocal Grooming',
    summary: 'Language evolved primarily to convey gossip about who hates whom, who is honest, and who is a cheat.',
    harariQuote:
      'It is not enough for individual men and women to know the whereabouts of lions and bisons. It is much more important for them to know who in their band hates whom, who is sleeping with whom, who is honest, and who is a cheat.',
    discussion:
      'Social information about pack members is essential for cooperation. By talking about each other, Sapiens could maintain cohesive bands of up to 50 without needing 8 hours of daily fur-picking.',
    keyTakeaway: 'Gossip is not trivial: it was humanity’s first intelligence network.'
  },
  {
    id: 'luxury_trap',
    era: 'agricultural',
    title: 'The Luxury Trap',
    concept: 'History’s Biggest Fraud',
    summary: 'How agricultural innovations intended to make life easier irrevocably trapped humanity into harder labor.',
    harariQuote:
      'How many young college graduates have taken demanding jobs in high-powered firms, vowing that they will work hard to earn money, and then retire and pursue their real interests when they are thirty-five? But by the time they reach that age, they have large mortgages, children to school, cars... The trap closed.',
    discussion:
      'Wheat promised bread and security. Instead, it produced backbreaking spinal stress, malaria, famine vulnerability, and ruthless property wars. Once population swelled on grain calories, there was no going back to nomadic foraging without mass starvation.',
    keyTakeaway: 'Conveniences become necessities and spawn new obligations. The trap snaps shut.'
  },
  {
    id: 'imagined_order',
    era: 'agricultural',
    title: 'Imagined Orders',
    concept: 'The Social Glue of Civilizations',
    summary: 'Societal orders such as legal codes, human rights, corporations, and divine kings exist only in our collective consciousness.',
    harariQuote:
      'There are no gods in the universe, no nations, no money, no human rights, no laws, and no justice outside the common imagination of human beings.',
    discussion:
      'A chimpanzee cannot be convinced to give you a banana with the promise of infinite bananas in chimpanzee heaven. Sapiens build cathedrals, fight world wars, and respect paper contracts entirely because of shared belief in imagined realities.',
    keyTakeaway: 'The world we live in is split into objective reality (rivers, trees, disease) and imagined reality (states, money, corporations).'
  },
  {
    id: 'universal_money',
    era: 'agricultural',
    title: 'The Invention of Money',
    concept: 'The Ultimate Mutual Trust System',
    summary: 'Money is not a physical commodity; it is a psychological construct based on the belief that someone else will accept it.',
    harariQuote:
      'Money is the most universal and most efficient system of mutual trust ever invented. Even people who do not believe in the same god or obey the same king are more than willing to use the same money.',
    discussion:
      'Osama bin Laden hated American culture, politics, and religion—yet he had no objection to American hundred-dollar bills. Money bridges every religious, racial, and geographic divide.',
    keyTakeaway: 'Money works because everyone believes that everyone else believes in it.'
  },
  {
    id: 'scientific_revolution',
    era: 'scientific',
    title: 'The Scientific Revolution',
    concept: 'Ignoramus: The Discovery of Ignorance',
    summary: 'The shift that occurred when human societies acknowledged they did not know everything, fueling empiricism and imperialism.',
    harariQuote:
      'The willingness to admit ignorance has made modern science much more dynamic, pliable and inquisitive than any previous tradition of knowledge.',
    discussion:
      'In pre-modern times, the Pope, the Caliph, or the Vedas were believed to hold all fundamental truths. Admitting ignorance created empty maps that Europeans felt compelled to explore, fusing science with state power and global capital.',
    keyTakeaway: 'True scientific progress begins the moment we honestly say: "We do not know."'
  }
];

export const INITIAL_QUESTS: Quest[] = [
  {
    id: 'quest_1_tree_of_knowledge',
    era: 'cognitive',
    title: 'The Tree of Knowledge',
    harariChapter: 'Chapter 2',
    description: 'Awaken the cognitive mutation. Gather flint and establish the first campfire storytelling circle.',
    objective: 'Reach 35 Knowledge and 40 Myth Power.',
    rewardText: 'Unlocks the ability to pass the Dunbar threshold of 150 band members.',
    completed: false,
    isUnlocked: true,
    checkCompletion: (res) => res.knowledge >= 35 && res.mythPower >= 40,
  },
  {
    id: 'quest_2_dunbar_barrier',
    era: 'cognitive',
    title: 'Break the Dunbar Barrier',
    harariChapter: 'Chapter 2',
    description: 'A chimpanzee troop splinters at 50; human bands splinter at 150 without shared myth. Expand your band beyond 150 members.',
    objective: 'Grow your population to at least 150 while maintaining Dunbar Limit >= 150.',
    rewardText: 'Proves the superiority of Homo Sapiens over solitary hominid bands.',
    completed: false,
    isUnlocked: false,
    checkCompletion: (res) => res.population >= 150 && res.dunbarLimit >= 150,
  },
  {
    id: 'quest_3_carve_totem',
    era: 'cognitive',
    title: 'The Lion-Man of Stadel',
    harariChapter: 'Chapter 2',
    description: 'Carve the half-human, half-lion ivory totem to embody the guardian spirit of the clan.',
    objective: 'Unlock the "Shared Myth & Totemism" technology.',
    rewardText: 'Grants +100 Dunbar limit and initiates regional clan alliance.',
    completed: false,
    isUnlocked: false,
    requiredDiscovery: 'shared_fiction',
    checkCompletion: (_res, techs) => techs.includes('shared_fiction'),
  },
  {
    id: 'quest_4_megafauna_hunt',
    era: 'cognitive',
    title: 'The Great Megafauna Hunt',
    harariChapter: 'Chapter 4: The Flood',
    description: 'Coordinate multiple bands with spear throwers to take down a mammoth and amass winter food stores.',
    objective: 'Store at least 400 Calories and amass 120 Flint & Stone.',
    rewardText: 'Ensures the survival of the tribe and paves the way for the Neolithic transition.',
    completed: false,
    isUnlocked: false,
    checkCompletion: (res) => res.calories >= 400 && res.flintAndStone >= 120,
  },
  {
    id: 'quest_5_luxury_trap',
    era: 'agricultural',
    title: 'The Luxury Trap',
    harariChapter: 'Chapter 5: History\'s Biggest Fraud',
    description: 'Plant wild emmer seeds along the riverbanks, domesticate grain, and build permanent mud-brick granaries.',
    objective: 'Unlock "Wheat & Grain Domestication" and achieve 250 Population.',
    rewardText: 'Launches the Agricultural Revolution with exponential population growth.',
    completed: false,
    isUnlocked: false,
    requiredDiscovery: 'emmer_cultivation',
    checkCompletion: (res, techs) => techs.includes('emmer_cultivation') && res.population >= 250,
  },
  {
    id: 'quest_6_code_of_hammurabi',
    era: 'agricultural',
    title: 'The Imagined Order of Babylon',
    harariChapter: 'Chapter 6: Building Pyramids',
    description: 'Carve universal laws in black diorite so 50,000 citizens obey an imagined divine hierarchy.',
    objective: 'Unlock "Imagined Orders & Legal Codes" and reach 500 Dunbar Limit.',
    rewardText: 'Enables massive empires and complex social stratification.',
    completed: false,
    isUnlocked: false,
    requiredDiscovery: 'imagined_orders',
    checkCompletion: (res, techs) => techs.includes('imagined_orders') && res.dunbarLimit >= 500,
  },
  {
    id: 'quest_7_scientific_breakthrough',
    era: 'scientific',
    title: 'Ignoramus: The Scientific Revolution',
    harariChapter: 'Chapter 14: The Discovery of Ignorance',
    description: 'Acknowledge human ignorance, question ancient dogmas, and map the uncharted universe with empirical science.',
    objective: 'Unlock "The Scientific Method & Ignorance" and amass 300 Knowledge.',
    rewardText: 'Transfers humankind from biological natural selection to intelligent design!',
    completed: false,
    isUnlocked: false,
    requiredDiscovery: 'scientific_method',
    checkCompletion: (res, techs) => techs.includes('scientific_method') && res.knowledge >= 300,
  }
];

// Pure calculation functions for the game rules
export function calculateDunbarFriction(population: number, dunbarLimit: number, mythPower: number): number {
  if (population <= dunbarLimit) return 0;
  const excess = population - dunbarLimit;
  // Myth power dampens friction
  const mythMitigation = Math.min(excess * 0.8, mythPower * 0.5);
  return Math.max(0, excess - mythMitigation);
}

export function calculateTurnConsumption(resources: GameResources): {
  consumedCalories: number;
  newCalories: number;
  isFamine: boolean;
  populationDelta: number;
} {
  // Each 10 population requires ~12 calories per tick
  const baseReq = Math.ceil((resources.population / 10) * 12);
  const friction = calculateDunbarFriction(resources.population, resources.dunbarLimit, resources.mythPower);
  const frictionCalorieCost = Math.ceil(friction * 0.5);
  const totalCost = baseReq + frictionCalorieCost;

  if (resources.calories >= totalCost) {
    const growth = friction > 20 ? 0 : Math.max(1, Math.floor(resources.population * 0.04));
    return {
      consumedCalories: totalCost,
      newCalories: resources.calories - totalCost,
      isFamine: false,
      populationDelta: growth
    };
  } else {
    // Famine: starvation occurs
    const deficit = totalCost - resources.calories;
    const loss = Math.min(resources.population - 5, Math.max(3, Math.floor(deficit / 4)));
    return {
      consumedCalories: resources.calories,
      newCalories: 0,
      isFamine: true,
      populationDelta: -loss
    };
  }
}

export function applyDilemmaEffects(
  current: GameResources,
  effects: DilemmaChoice['effects']
): GameResources {
  return {
    population: Math.max(5, current.population + (effects.population || 0)),
    dunbarLimit: Math.max(50, current.dunbarLimit + (effects.dunbarLimit || 0)),
    mythPower: Math.max(0, current.mythPower + (effects.mythPower || 0)),
    calories: Math.max(0, current.calories + (effects.calories || 0)),
    flintAndStone: Math.max(0, current.flintAndStone + (effects.flintAndStone || 0)),
    knowledge: Math.max(0, current.knowledge + (effects.knowledge || 0)),
  };
}

export function canUnlockTech(tech: DiscoveryTech, res: GameResources): boolean {
  if (tech.unlocked) return false;
  if (res.knowledge < tech.cost.knowledge) return false;
  if (tech.cost.mythPower && res.mythPower < tech.cost.mythPower) return false;
  if (tech.cost.flintAndStone && res.flintAndStone < tech.cost.flintAndStone) return false;
  return true;
}

export function deductTechCost(tech: DiscoveryTech, res: GameResources): GameResources {
  return {
    ...res,
    knowledge: res.knowledge - tech.cost.knowledge,
    mythPower: tech.cost.mythPower ? res.mythPower - tech.cost.mythPower : res.mythPower,
    flintAndStone: tech.cost.flintAndStone ? res.flintAndStone - tech.cost.flintAndStone : res.flintAndStone,
  };
}

export function checkVictoryCondition(unlockedTechIds: string[], res: GameResources): boolean {
  return (
    unlockedTechIds.includes('scientific_method') &&
    res.population >= 300 &&
    res.knowledge >= 300
  );
}

export function checkDefeatCondition(res: GameResources): boolean {
  return res.population <= 3 || (res.calories === 0 && res.population < 10);
}
