import {
  GameResources,
  HistoricalEra,
  HistoricalDilemma,
  DiscoveryTech,
  CodexEntry,
  Quest,
  DilemmaChoice,
  ImaginedOrder,
  LandmarkInfo,
  MegafaunaState,
  Achievement,
  RunStats,
  SapiensLandscape,
  DynamicWorldEvent,
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
    id: 'open_observatory', era: 'scientific', title: 'Who can use the observatory?',
    historicalContext: 'Your settlement has built an observatory. The council must decide whether its records should circulate widely or support a smaller group of specialists. This is a fictional scenario about access to knowledge.',
    bookQuote: '', chapterRef: 'Original game scenario',
    choices: [
      {id:'share_observations',label:'Share the records',description:'Invite others to compare observations and question results.',harariTheory:'Open exchange can encourage criticism and new ideas.',effects:{knowledge:60,mythPower:10,flintAndStone:-20}},
      {id:'fund_specialists',label:'Fund specialist instruments',description:'Focus resources on accurate tools for a smaller research team.',harariTheory:'Specialization trades broad access for concentrated expertise.',effects:{knowledge:40,flintAndStone:25,calories:-35}},
    ],
  },

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

export const INITIAL_MEGAFAUNA: MegafaunaState = {
  count: 4,
  maxCount: 4,
  isExtinct: false,
  extinctionReflected: false,
};

export const INITIAL_IMAGINED_ORDERS: ImaginedOrder[] = [
  {
    id: 'order_animism',
    era: 'cognitive',
    name: 'Animism & Spirit Guardians',
    mantra: 'Every rock, tree, and beast possesses a sentient soul.',
    description: 'The world is an egalitarian community of living beings. Humankind does not sit atop a hierarchy.',
    harariQuote: 'Foragers lived in an animist world where there was no clear barrier between human beings and other animals.',
    dunbarBonus: 50,
    mythCost: 15,
    perkDescription: '+50 Dunbar threshold, +15% gathering yields from natural harmony.',
    active: true,
  },
  {
    id: 'order_lion_man',
    era: 'cognitive',
    name: 'Totem of the Lion-Man',
    mantra: 'The lion spirit protects all bands who wear the sacred ivory amulet.',
    description: 'First collective myth transcending biological kin, forging alliances between distant bands.',
    harariQuote: 'Any monkey can say "Look, a lion!" Only Sapiens can say "The lion is the guardian spirit of our tribe."',
    dunbarBonus: 120,
    mythCost: 40,
    perkDescription: '+120 Dunbar threshold, unlocks megafauna hunting coordination.',
    active: false,
  },
  {
    id: 'order_divine_sun_king',
    era: 'agricultural',
    name: 'The Divine Sun-King',
    mantra: 'The monarch is ordained by heaven; to rebel is to defy the cosmos.',
    description: 'Massive imagined order creating divine hierarchy to enforce justice and taxation across thousands.',
    harariQuote: 'Hammurabi and the American Founding Fathers both imagined an order based on eternal, universal principles of justice.',
    dunbarBonus: 450,
    mythCost: 75,
    perkDescription: '+450 Dunbar threshold, +30% agricultural grain output, prevents tribal fractures.',
    active: false,
  },
  {
    id: 'order_universal_money',
    era: 'agricultural',
    name: 'Universal Trust of Money',
    mantra: 'In gold and silver we place our shared faith.',
    description: 'The most universal system of mutual trust ever conceived, uniting strangers across religious and imperial borders.',
    harariQuote: 'Money is the only trust system created by humans that can bridge almost any cultural gap, and does not discriminate.',
    dunbarBonus: 1000,
    mythCost: 110,
    perkDescription: '+1000 Dunbar threshold, frictionless trade, amasses wealth and knowledge.',
    active: false,
  },
  {
    id: 'order_humanism_science',
    era: 'scientific',
    name: 'Empirical Humanism & Scientism',
    mantra: 'We admit our ignorance; through empirical inquiry and human empathy we master the cosmos.',
    description: 'The modern order recognizing ignorance, seeking testable truth, and enshrining inalienable human dignity.',
    harariQuote: 'The willingness to admit ignorance has made modern science much more dynamic, pliable and inquisitive than any previous tradition of knowledge.',
    dunbarBonus: 3000,
    mythCost: 160,
    perkDescription: '+3000 Dunbar threshold, eliminates all social friction, accelerates discoveries.',
    active: false,
  },
];

export const WORLD_LANDMARKS: LandmarkInfo[] = [
  {
    id: 'campfire',
    name: 'Sacred Campfire Hearth',
    title: 'The Hearth of Stories',
    actionText: 'Commune & Shape Imagined Orders',
    description: 'Where our ancestors roasted roots, predigested calories, and sat under the stars inventing stories that conquered the world.',
    harariContext: 'Campfire cooking shrank our intestines and teeth while fueling a metabolically ravenous 1,400cc brain.',
    x: 0,
    z: 0,
  },
  {
    id: 'mammoth',
    name: 'Megafauna Steppe Herd',
    title: 'The Woolly Giants',
    actionText: 'Coordinate Megafauna Hunt',
    description: 'Massive mammoths roam the cold steppe. Coordinated hunting with spear throwers yields mountain of meat, but risks ecological wipeout.',
    harariContext: 'Wherever Sapiens arrived—in Australia, the Americas, and Eurasia—giant terrestrial animals disappeared forever within centuries.',
    x: 15,
    z: -12,
  },
  {
    id: 'megaliths',
    name: 'Göbekli Tepe Sanctuary',
    title: 'The First Temple',
    actionText: 'Engrave Sacred Limestone Reliefs',
    description: 'Monumental T-shaped pillars erected by hunter-gatherers thousands of years before agriculture. Myth built religion before farming built villages.',
    harariContext: 'Archaeologists were stunned by Göbekli Tepe: cultural belief and temple construction catalyzed agriculture, not the other way around.',
    x: -16,
    z: -14,
  },
  {
    id: 'wheat',
    name: 'Emmer Wheat Fields',
    title: 'The Luxury Trap',
    actionText: 'Cultivate & Weed the Soil',
    description: 'Golden stalks of emmer wheat. Demands backbreaking dawn-to-dusk toil, but yields vast caloric surpluses that feed exploding populations.',
    harariContext: 'Wheat demanded 24/7 care. Our spine, knees, and neck were never evolved for hoeing, yet wheat conquered more global acreage than any wild grass.',
    x: 14,
    z: 8,
  },
  {
    id: 'cave',
    name: 'Cave of Hands & Totems',
    title: 'The Painted Sanctuary',
    actionText: 'Inscribe Clan History on Rock',
    description: 'Torchlit limestone rock shelter displaying hand stencils, galloping steppe bison, and the Stadel Lion-Man carving.',
    harariContext: 'Cave art was not interior decoration; it was the sacred matrix of humanity\'s first collective imagination.',
    x: -24,
    z: 2,
  },
];

export function executeHuntMegafauna(
  megafauna: MegafaunaState,
  resources: GameResources
): {
  success: boolean;
  newMegafauna: MegafaunaState;
  newResources: GameResources;
  message: string;
} {
  if (megafauna.count <= 0) {
    return {
      success: false,
      newMegafauna: { ...megafauna, isExtinct: true },
      newResources: resources,
      message: 'The megafauna is extinct in this region. As Harari wrote in Chapter 4, the giant beasts never recovered from humankind\'s arrival.',
    };
  }

  // Cost: requires some flint & stone for spears
  const flintCost = 15;
  if (resources.flintAndStone < flintCost) {
    return {
      success: false,
      newMegafauna: megafauna,
      newResources: resources,
      message: 'Insufficient flint spear points! Knap at least 15 flint tools to coordinate an ambush.',
    };
  }

  const remaining = megafauna.count - 1;
  const isNowExtinct = remaining <= 0;

  const meatYield = 180;
  const ivoryYield = 40;

  const updatedResources: GameResources = {
    ...resources,
    calories: resources.calories + meatYield,
    flintAndStone: resources.flintAndStone - flintCost + ivoryYield,
    knowledge: resources.knowledge + 12,
  };

  const updatedMegafauna: MegafaunaState = {
    ...megafauna,
    count: remaining,
    isExtinct: isNowExtinct,
    extinctionReflected: isNowExtinct,
  };

  const message = isNowExtinct
    ? 'Massive hunt successful! +180 Calories and +40 Ivory. But the last mammoth has fallen. Megafauna extinction in this territory is complete.'
    : `Hunt successful! Coordinated hunters brought down a mammoth (+180 Calories, +40 Ivory). ${remaining} herds remain on the steppe.`;

  return {
    success: true,
    newMegafauna: updatedMegafauna,
    newResources: updatedResources,
    message,
  };
}

export function consecrateImaginedOrder(
  orders: ImaginedOrder[],
  selectedId: string,
  resources: GameResources
): {
  success: boolean;
  newOrders: ImaginedOrder[];
  newResources: GameResources;
  message: string;
} {
  const target = orders.find(o => o.id === selectedId);
  if (!target) {
    return { success: false, newOrders: orders, newResources: resources, message: 'Order not found.' };
  }

  if (resources.mythPower < target.mythCost) {
    return {
      success: false,
      newOrders: orders,
      newResources: resources,
      message: `Insufficient Shared Myth! Needs ${target.mythCost} Myth Power to consecrate "${target.name}".`,
    };
  }

  const newOrders = orders.map(o => ({
    ...o,
    active: o.id === selectedId,
  }));

  const newResources: GameResources = {
    ...resources,
    mythPower: resources.mythPower - target.mythCost,
    dunbarLimit: Math.max(150, resources.dunbarLimit + target.dunbarBonus),
  };

  return {
    success: true,
    newOrders,
    newResources,
    message: `The tribe now lives under the imagined order: "${target.name}"! Dunbar Limit increased by +${target.dunbarBonus}.`,
  };
}

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_forage',
    title: 'The Forager\'s Intuition',
    description: 'Gather wild berries, amber gems, or flint nodules in the steppe.',
    icon: '🌾',
    era: 'cognitive',
    funFact: 'Paleolithic foragers possessed encyclopedic mental maps of thousands of plants, seasons, and animal tracks, working only ~30 hours weekly.',
    unlocked: false,
  },
  {
    id: 'dunbar_breaker',
    title: 'Breaking Dunbar\'s Limit',
    description: 'Grow the clan beyond 150 members without social fragmentation.',
    icon: '👥',
    era: 'cognitive',
    funFact: 'Primatologist Robin Dunbar showed that human brains can maintain stable personal social relationships with only ~150 people before shared myths are needed.',
    unlocked: false,
  },
  {
    id: 'ivory_totem',
    title: 'The Stadel Lion-Man',
    description: 'Unlock Shared Myth & Totemism or carve the lion-human ivory amulet.',
    icon: '🦁',
    era: 'cognitive',
    funFact: 'Found in a German cave, the 40,000-year-old Lion-Man carved from mammoth tusk is humankind\'s earliest undisputed proof of abstract religious fiction.',
    unlocked: false,
  },
  {
    id: 'megafauna_down',
    title: 'Winter Food Reserve',
    description: 'Gather supplies and store at least 250 food and 60 flint.',
    icon: '🦣',
    era: 'cognitive',
    funFact: 'Wherever Sapiens settled—Australia, the Americas, and Eurasia—over 70% of all large terrestrial animal species vanished within a few thousand years.',
    unlocked: false,
  },
  {
    id: 'luxury_trap',
    title: 'History\'s Biggest Fraud',
    description: 'Domesticate emmer wheat and enter the Agricultural Revolution.',
    icon: '🍞',
    era: 'agricultural',
    funFact: 'Wheat forced humans to trade varied diets and healthy nomadic spines for backbreaking dawn-to-dusk field labor, malnutrition, and infectious diseases.',
    unlocked: false,
  },
  {
    id: 'hammurabi_law',
    title: 'The Code of the King',
    description: 'Codify divine legal orders to govern thousands of citizens.',
    icon: '⚖️',
    era: 'agricultural',
    funFact: 'Hammurabi\'s Code was an imagined order: it claimed divine origin so 1,000,000 citizens would accept social stratification as eternal cosmic truth.',
    unlocked: false,
  },
  {
    id: 'universal_shekel',
    title: 'The Universal Trust of Money',
    description: 'Establish financial currency to bridge disparate cultures.',
    icon: '🪙',
    era: 'agricultural',
    funFact: 'Money is the only trust system created by humans that can bridge almost any cultural gap, and does not discriminate on religion, race, or king.',
    unlocked: false,
  },
  {
    id: 'ignoramus',
    title: 'The Discovery of Ignorance',
    description: 'Admit ignorance and unlock the Scientific Method.',
    icon: '🔭',
    era: 'scientific',
    funFact: 'Pre-modern maps had no blank spaces. The Scientific Revolution began the moment Europeans drew blank ocean maps with the courage to say: "We do not know."',
    unlocked: false,
  },
  {
    id: 'savannah_sprinter',
    title: 'Savannah Sprinter',
    description: 'Achieve a 5x or higher combo streak while navigating obstacles.',
    icon: '⚡',
    era: 'cognitive',
    funFact: 'Humans are the greatest endurance runners in the animal kingdom; our sweat glands and bipedal stride let our ancestors run antelopes to exhaustion.',
    unlocked: false,
  },
  {
    id: 'apex_agility',
    title: 'Apex Agility',
    description: 'Perform acrobatic jumps and slides through the prehistoric steppe.',
    icon: '🏃',
    era: 'cognitive',
    funFact: 'Skeletal remains reveal that prehistoric foragers had denser leg bones, better posture, and greater physical symmetry than post-industrial humans.',
    unlocked: false,
  },
];

export function checkNewAchievements(
  resources: GameResources,
  unlockedTechs: string[],
  stats: RunStats,
  currentAchievements: Achievement[],
  _turnCount: number
): {
  updatedAchievements: Achievement[];
  newlyUnlocked: Achievement[];
} {
  const newlyUnlocked: Achievement[] = [];

  const updatedAchievements = currentAchievements.map(ach => {
    if (ach.unlocked) return ach;

    let shouldUnlock = false;

    switch (ach.id) {
      case 'first_forage':
        shouldUnlock = stats.pickupsCollected >= 1;
        break;
      case 'dunbar_breaker':
        shouldUnlock = resources.population > 150;
        break;
      case 'ivory_totem':
        shouldUnlock = unlockedTechs.includes('shared_fiction') || resources.mythPower >= 50;
        break;
      case 'megafauna_down':
        shouldUnlock = stats.pickupsCollected >= 1 && resources.flintAndStone >= 60 && resources.calories >= 250;
        break;
      case 'luxury_trap':
        shouldUnlock = unlockedTechs.includes('emmer_cultivation');
        break;
      case 'hammurabi_law':
        shouldUnlock = unlockedTechs.includes('imagined_orders') || resources.dunbarLimit >= 400;
        break;
      case 'universal_shekel':
        shouldUnlock = unlockedTechs.includes('money_universal_trust');
        break;
      case 'ignoramus':
        shouldUnlock = unlockedTechs.includes('scientific_method');
        break;
      case 'savannah_sprinter':
        shouldUnlock = stats.comboStreak >= 5 || stats.maxCombo >= 5;
        break;
      case 'apex_agility':
        shouldUnlock = (stats.jumpsCount + stats.slidesCount) >= 5;
        break;
    }

    if (shouldUnlock) {
      const unlockedAch: Achievement = {
        ...ach,
        unlocked: true,
        unlockedAt: Date.now(),
      };
      newlyUnlocked.push(unlockedAch);
      return unlockedAch;
    }

    return ach;
  });

  return { updatedAchievements, newlyUnlocked };
}

// Location-specific Environmental Dynamic Events
export const DYNAMIC_WORLD_EVENTS: DynamicWorldEvent[] = [
  // 1. River Meadow Events
  {
    id: 'event_meadow_rain',
    type: 'seasonal_rainfall',
    title: 'Spring Meadow Cloudburst & Rain Deluge',
    landscape: 'river_meadow',
    description: 'A sudden torrential spring rainstorm cascades over the wildflower valley, swelling the winding creek and causing rapid plant growth.',
    harariHistoricalNote: 'Foragers followed micro-climates; seasonal spring cloudbursts triggered explosion of edible tuber shoots and sweet wild berry blooms within hours.',
    duration: 24,
    remainingTime: 24,
    perkDescription: '🌧️ +100% Calorie yields from wild berries & lush creek vegetation',
    perkMultiplier: { calories: 2.0, knowledge: 1.5 },
    weatherStyle: 'rain',
    active: false,
  },
  {
    id: 'event_meadow_gazelles',
    type: 'gazelle_migration',
    title: 'Great Steppe Gazelle & Wild Equine Migration',
    landscape: 'river_meadow',
    description: 'Thundering hooves shake the grassy steppe as hundreds of migrating wild gazelles and horses sweep across the valley meadows.',
    harariHistoricalNote: 'Sapiens organized coordinated ambushes at river crossings where migrating herds were forced to bottleneck.',
    duration: 26,
    remainingTime: 26,
    perkDescription: '🦌 +40 Calories from herd tracking & +25 Knowledge',
    perkMultiplier: { calories: 1.8, knowledge: 2.0 },
    weatherStyle: 'clear_sun',
    animalMigration: 'gazelles',
    active: false,
  },

  // 2. Wetland Oasis Events
  {
    id: 'event_wetland_monsoon',
    type: 'monsoon_deluge',
    title: 'Monsoon Deluge & Sacred Lotus Bloom',
    landscape: 'wetland_oasis',
    description: 'Heavy atmospheric rain blankets the lagoon, releasing ethereal water mist as giant night-blooming lotus pads open simultaneously.',
    harariHistoricalNote: 'Wetlands provided unprecedented year-round caloric security, enabling early semi-sedentary spiritual gathering sites.',
    duration: 25,
    remainingTime: 25,
    perkDescription: '🪷 2x Amber Gem value & +35 Shared Myth power',
    perkMultiplier: { amber: 2.0, myth: 2.0 },
    weatherStyle: 'storm',
    active: false,
  },

  // 3. Mountain Pass Events
  {
    id: 'event_mountain_mammoth',
    type: 'mammoth_migration',
    title: 'Great Woolly Mammoth Canyon Arch Migration',
    landscape: 'mountain_pass',
    description: 'A majestic family of giant woolly mammoths treks across the natural stone bridge arch and canyon passes, trumpeting across the gorge.',
    harariHistoricalNote: 'Mammoth ivory was both the titanium and gold of the Upper Paleolithic—used for puncture-proof armor, spear points, and religious idols.',
    duration: 28,
    remainingTime: 28,
    perkDescription: '🦣 +50 Mammoth Ivory material & +40 Ancient Ecological Knowledge',
    perkMultiplier: { amber: 2.0, knowledge: 2.5 },
    weatherStyle: 'clear_sun',
    animalMigration: 'mammoths',
    active: false,
  },
  {
    id: 'event_mountain_squall',
    type: 'mountain_squall',
    title: 'Highland Squall & Radiant Sunburst',
    landscape: 'mountain_pass',
    description: 'Cold alpine gale winds whistle through the stone bridge canyon, clearing the fog into a blinding sunburst of crystal clarity.',
    harariHistoricalNote: 'Highland winds forced hunters to master aerodynamic flint projectile shaping to hunt agile mountain game.',
    duration: 22,
    remainingTime: 22,
    perkDescription: '🏔️ 2x Speed boost & double Migration score',
    perkMultiplier: { amber: 2.0, calories: 1.5 },
    weatherStyle: 'mist',
    active: false,
  },
];

export function getLandscapeEvents(landscape: SapiensLandscape): DynamicWorldEvent[] {
  return DYNAMIC_WORLD_EVENTS.filter(e => e.landscape === landscape);
}

// BUMP & RESPAWN COLLISION LOGIC ("if they bump twice make sure they respawn")
export interface BumpCollisionResult {
  bumped: boolean;
  newBumps: number;
  shouldRespawn: boolean;
  message: string;
}

export function handleBumpCollision(
  currentBumps: number,
  isInvulnerable: boolean
): BumpCollisionResult {
  if (isInvulnerable) {
    return {
      bumped: false,
      newBumps: currentBumps,
      shouldRespawn: false,
      message: 'Invulnerable! Obstacle phased safely.',
    };
  }

  const nextBumps = currentBumps + 1;
  if (nextBumps >= 2) {
    return {
      bumped: true,
      newBumps: 0, // Reset after respawn
      shouldRespawn: true,
      message: 'Second obstacle collision! Band leader down — respawning at safe checkpoint!',
    };
  }

  return {
    bumped: true,
    newBumps: nextBumps,
    shouldRespawn: false,
    message: 'Collision impact! (1/2 bumps — one more collision forces a respawn!)',
  };
}

export function applyEventResourcePerks(
  event: DynamicWorldEvent | null,
  baseGains: { calories: number; knowledge: number; amberMultiplier: number }
): { calories: number; knowledge: number; amberMultiplier: number } {
  if (!event || !event.active) {
    return baseGains;
  }

  return {
    calories: Math.round(baseGains.calories * (event.perkMultiplier.calories || 1.0)),
    knowledge: Math.round(baseGains.knowledge * (event.perkMultiplier.knowledge || 1.0)),
    amberMultiplier: baseGains.amberMultiplier * (event.perkMultiplier.amber || 1.0),
  };
}



