(function attachBlackbookIndexCatalog(global) {
  'use strict';

  const RANGE_ORDER = ['1D', '5D', '1M', '6M', 'YTD', '1Y', '5Y', '10Y', 'ALL'];
  const RANGE_META = {
    '1D': { label: '1 day', xLabels: ['09:30', '10:15', '11:00', '11:45', '12:30', '13:15', '14:00', '14:45', '15:30', '16:00'] },
    '5D': { label: '5 days', xLabels: ['Mon open', 'Mon close', 'Tue', 'Wed', 'Thu', 'Fri', 'Now'] },
    '1M': { label: '1 month', xLabels: ['Jul 1', 'Jul 7', 'Jul 12', 'Jul 18', 'Jul 24', 'Jul 31', 'Now'] },
    '6M': { label: '6 months', xLabels: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Now'] },
    YTD: { label: 'Year to date', xLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Now'] },
    '1Y': { label: '1 year', xLabels: ['Aug', 'Oct', 'Dec', 'Feb', 'Apr', 'Jun', 'Jul', 'Now'] },
    '5Y': { label: '5 years', xLabels: ['2022', '2023', '2024', '2025', '2026', 'Now'] },
    '10Y': { label: '10 years', xLabels: ['2017', '2019', '2021', '2023', '2025', 'Now'] },
    ALL: { label: 'All time', xLabels: ['Launch', '2022', '2023', '2024', '2025', 'Now'] },
  };

  const rounded = (value, places = 2) => Number(value.toFixed(places));
  const hash = (value) => [...value].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 7);
  const CATEGORY_VOLATILITY = {
    Athletes: 1.42,
    Clubs: 1.38,
    Artists: 1.2,
    'Public Figures': 1.18,
    Products: 1,
    'Relative Value': 1.12,
    Leagues: 0.82,
  };
  const RANGE_VOLATILITY = {
    '1D': 0.016,
    '5D': 0.025,
    '1M': 0.04,
    '6M': 0.065,
    YTD: 0.078,
    '1Y': 0.1,
    '5Y': 0.15,
    '10Y': 0.18,
    ALL: 0.21,
  };
  const RANGE_POINTS = {
    '1D': 180,
    '5D': 165,
    '1M': 155,
    '6M': 145,
    YTD: 145,
    '1Y': 150,
    '5Y': 135,
    '10Y': 135,
    ALL: 140,
  };

  const asset = (src, alt, type = 'logo') => ({ src, alt, type });
  const pairAsset = (left, right) => ({ type: 'pair', items: [left, right] });

  function seededRandom(seed) {
    let state = seed >>> 0;
    return () => {
      state += 0x6D2B79F5;
      let result = state;
      result = Math.imul(result ^ (result >>> 15), result | 1);
      result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
      return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeSeries(value, returnPct, seed, points, category, rangeKey) {
    const start = value / (1 + (returnPct / 100));
    const random = seededRandom(seed);
    const precision = value < 10 ? 4 : 2;
    const categoryVolatility = CATEGORY_VOLATILITY[category] || 1;
    const noiseScale = Math.abs(value) * RANGE_VOLATILITY[rangeKey] * categoryVolatility;
    const rawNoise = [0];
    let walk = 0;
    let eventImpulse = 0;
    const shockCount = rangeKey === '1D' || rangeKey === '5D' ? 5 : 4;
    const shockPoints = new Set(Array.from({ length: shockCount }, (_, index) => (
      Math.floor(points * ((index + 1) / (shockCount + 1)) + (random() - 0.5) * points * 0.08)
    )));

    for (let index = 1; index < points - 1; index += 1) {
      const progress = index / (points - 1);
      const sessionBurst = 0.7 + Math.pow(Math.sin(progress * Math.PI), 0.7) * 0.8;
      walk = walk * 0.78 + (random() - 0.5) * 2.2 * sessionBurst;
      if (shockPoints.has(index)) {
        const direction = random() > 0.44 ? 1 : -1;
        eventImpulse += direction * (2.4 + random() * 3.8);
      }
      eventImpulse *= 0.875;
      const microJitter = (random() - 0.5) * (rangeKey === '1D' ? 1.4 : 0.85);
      rawNoise.push(walk + eventImpulse + microJitter);
    }
    rawNoise.push(0);

    const maximumNoise = Math.max(...rawNoise.map((entry) => Math.abs(entry)), 1);
    const values = rawNoise.map((entry, index) => {
      const progress = index / (points - 1);
      const baseline = start + ((value - start) * progress);
      const endpointEnvelope = Math.pow(Math.sin(progress * Math.PI), 0.62);
      const noise = (entry / maximumNoise) * noiseScale * endpointEnvelope;
      return rounded(Math.max(value < 10 ? 0.0001 : 1, baseline + noise), precision);
    });

    values[0] = rounded(start, precision);
    values[values.length - 1] = value;
    return values;
  }

  function makeRanges(symbol, value, oneDayReturn, suppliedReturns, category) {
    const seed = hash(symbol);
    const returns = suppliedReturns || [
      oneDayReturn,
      rounded(oneDayReturn * 1.9 + ((seed % 9) - 4) * 0.33),
      rounded(oneDayReturn * 3.1 + ((seed % 15) - 7) * 0.72),
      rounded(oneDayReturn * 5.6 + ((seed % 31) - 15) * 1.22),
      rounded(oneDayReturn * 7.5 + ((seed % 47) - 23) * 1.3),
      rounded(oneDayReturn * 10.5 + ((seed % 61) - 30) * 1.9),
      rounded(oneDayReturn * 29 + 80 + (seed % 70)),
      rounded(oneDayReturn * 48 + 160 + (seed % 180)),
      rounded(oneDayReturn * 68 + 250 + (seed % 300)),
    ];

    return RANGE_ORDER.reduce((ranges, key, index) => {
      ranges[key] = {
        key,
        label: RANGE_META[key].label,
        return: returns[index],
        current: value,
        series: makeSeries(value, returns[index], seed + index * 19, RANGE_POINTS[key], category, key),
        xLabels: RANGE_META[key].xLabels,
      };
      return ranges;
    }, {});
  }

  function componentSet(category, name) {
    const sets = {
      Artists: [
        ['Consumption', '34%', 'Streaming, sales, and audience retention'],
        ['Cultural momentum', '26%', 'Conversation, search, and editorial reach'],
        ['Live demand', '22%', 'Touring, ticket demand, and venue scale'],
        ['Commercial reach', '18%', 'Brand partnerships and catalogue value'],
      ],
      Athletes: [
        ['Competitive impact', '36%', 'Performance, availability, and match influence'],
        ['Audience growth', '25%', 'Search interest, social reach, and viewership'],
        ['Team context', '21%', 'Club results and role in major moments'],
        ['Commercial reach', '18%', 'Partnerships and global brand demand'],
      ],
      Clubs: [
        ['On-field results', '35%', 'Results, trophies, and competition strength'],
        ['Squad quality', '25%', 'Availability, depth, and transfer activity'],
        ['Global audience', '22%', 'Viewership, reach, and supporter growth'],
        ['Commercial power', '18%', 'Sponsorship, merchandising, and demand'],
      ],
      Leagues: [
        ['Competition quality', '31%', 'Competitive balance and marquee fixtures'],
        ['Audience scale', '27%', 'Broadcast reach and global attention'],
        ['Club strength', '24%', 'Underlying constituent club performance'],
        ['Commercial growth', '18%', 'Media, partner, and ticket demand'],
      ],
      Products: [
        ['Product adoption', '35%', 'Active use, retention, and growth signals'],
        ['Product velocity', '25%', 'Launches, feature releases, and reliability'],
        ['Market attention', '22%', 'Search, press, and developer conversation'],
        ['Ecosystem strength', '18%', 'Integrations, partners, and distribution'],
      ],
      'Public Figures': [
        ['Platform reach', '31%', 'Audience scale and engagement quality'],
        ['Business execution', '27%', 'Company, product, and partnership signals'],
        ['Narrative velocity', '23%', 'Search, press, and cultural attention'],
        ['Network influence', '19%', 'Cross-market and ecosystem spillover'],
      ],
      'Relative Value': [
        ['Underlying spread', '42%', 'Relative movement of the two live indices'],
        ['Shared liquidity', '24%', 'Depth from each underlying market'],
        ['Event divergence', '20%', 'Signals that affect one leg more than the other'],
        ['Correlation regime', '14%', 'How tightly the two legs are currently coupled'],
      ],
    };

    return (sets[category] || sets.Clubs).map(([label, weight, detail]) => ({ label, weight, detail, name }));
  }

  function subjectName(name) {
    return String(name || '').replace(/\s+Index$/i, '');
  }

  function indexFocus(category, subject) {
    return {
      Artists: `catalogue demand, audience attention, live presence, and commercial pull around ${subject}`,
      Athletes: `match impact, availability, audience attention, and commercial pull around ${subject}`,
      Clubs: `results, squad strength, supporter energy, and commercial pull around ${subject}`,
      Products: `adoption, product momentum, user attention, and the ecosystem around ${subject}`,
      'Public Figures': `public attention, business activity, audience reach, and influence around ${subject}`,
      Leagues: `fixtures, rivalries, star power, and audience interest across ${subject}`,
      'Relative Value': `the relative momentum of the two names behind ${subject}`,
    }[category] || `public attention and activity around ${subject}`;
  }

  function indexAbout(config) {
    const subject = subjectName(config.name);
    if (config.category === 'Relative Value') {
      return `The ${subject} Index compares the relative momentum of Real Madrid and Lamine Yamal. ${config.about || 'It keeps both names in one view so the contrast is easy to follow.'}`;
    }
    return `The ${subject} Index is a live read on ${indexFocus(config.category, subject)}. ${config.about || `It follows the public story around ${subject} as it develops.`}`;
  }

  function performanceNews(config) {
    const subject = subjectName(config.name);
    const changePct = Number(config.changePct || 0);
    const direction = changePct < 0 ? 'slips' : 'advances';
    const movement = changePct < 0 ? 'cools' : 'builds';
    const focus = {
      Artists: 'catalogue attention',
      Athletes: 'match momentum',
      Clubs: 'club momentum',
      Products: 'product attention',
      'Public Figures': 'public attention',
      Leagues: 'competition interest',
      'Relative Value': 'the spread between both names',
    }[config.category] || 'attention';
    const support = {
      Artists: 'catalogue depth and audience demand',
      Athletes: 'match impact and the player’s wider story',
      Clubs: 'results, squad identity, and supporter energy',
      Products: 'everyday use, releases, and the surrounding ecosystem',
      'Public Figures': 'public work, business activity, and audience reach',
      Leagues: 'fixtures, rivalries, and the season’s larger narrative',
      'Relative Value': 'the contrast between the two underlying stories',
    }[config.category] || 'the wider story around the name';
    return [
      {
        time: 'Today',
        source: 'Blackbook Markets',
        title: `${subject} Index ${direction} ${Math.abs(changePct).toFixed(2)}% as ${focus} ${movement}`,
        summary: `The session puts ${subject} at ${Number(config.value).toLocaleString('en-US', { minimumFractionDigits: config.unit === 'RATIO' ? 4 : 2, maximumFractionDigits: config.unit === 'RATIO' ? 4 : 2 })}; ${support} remain central to how the move is being read.`,
      },
      {
        time: 'Yesterday',
        source: 'Blackbook Markets Desk',
        title: `What is carrying the ${subject} Index through the session`,
        summary: `${subject} has more depth than one print: ${support} continue to shape the longer view around the name.`,
      },
    ];
  }

  function defaultMethodology(category, name, symbol) {
    const subject = subjectName(name);
    if (category === 'Relative Value') {
      return [
        `${symbol} places the Real Madrid and Lamine Yamal stories side by side so their relative momentum is easy to follow.`,
        'The pair is read through each name’s recent performances, public attention, and the moments that change the conversation around them.',
        'It is a comparison between two indices, not a prediction about a single match or headline.',
      ];
    }

    const lens = {
      Artists: `recordings, performances, collaborations, and the culture around ${subject}`,
      Athletes: `matches, movement, availability, and the attention around ${subject}`,
      Clubs: `results, players, supporters, and the city around ${subject}`,
      Products: `everyday use, design, releases, and the people who build around ${subject}`,
      'Public Figures': `public work, companies, ideas, and the audience around ${subject}`,
      Leagues: `teams, rivalries, stars, and the rhythm of the ${subject} season`,
    };
    const arrivals = {
      Artists: `new releases, performances, collaborations, and cultural moments arrive`,
      Athletes: `new matches, availability updates, and career moments arrive`,
      Clubs: `new fixtures, transfers, and club milestones arrive`,
      Products: `new releases, features, and user habits arrive`,
      'Public Figures': `new ventures, public statements, and appearances arrive`,
      Leagues: `new fixtures, rivalries, and season milestones arrive`,
    };

    return [
      `The ${subject} Index is read through ${lens[category] || `the work and public moments around ${subject}`}.`,
      `Recent moments are read alongside the longer story that has made ${subject} matter to its audience.`,
      `The index moves as ${arrivals[category] || `new public moments arrive`}.`,
    ];
  }

  function defaultNews(name, category) {
    const subject = subjectName(name);
    return [
      {
        time: 'Today',
        source: 'Blackbook Editorial',
        title: `${subject}: the work and moments keeping the index in motion`,
        summary: `A concise look at the performance and attention around ${subject}.`,
      },
      {
        time: 'Yesterday',
        source: 'Blackbook Desk',
        title: `${subject} beyond the headline`,
        summary: `${subject}'s catalogue, products, performances, or competitive record in context.`,
      },
    ];
  }

  function makeRecord(config) {
    const unit = config.unit || 'POINT';
    const precision = unit === 'RATIO' ? 4 : 2;
    const previousClose = rounded(config.value / (1 + (config.changePct / 100)), precision);
    const quote = {
      value: config.value,
      unit,
      changePct: config.changePct,
      change: rounded(config.value - previousClose, precision),
      asOf: 'As of Jul 31, 2026',
    };
    const intradayMove = Math.max(Math.abs(quote.change), unit === 'RATIO' ? 0.007 : 44);
    const rawOpenOffset = (hash(config.symbol) % 9) - 4;
    const openOffset = rawOpenOffset === 0 ? 2 : rawOpenOffset;
    const statistics = {
      volume: config.volume || `${(1.1 + (hash(config.symbol) % 86) / 10).toFixed(1)}M`,
      density: config.density || Math.min(99, Math.max(1, 38 + (hash(config.symbol) % 58))),
      previousClose,
      open: rounded(previousClose * (1 + (openOffset / 1000)), precision),
      dayRange: [
        rounded(Math.min(config.value, previousClose) - intradayMove * 0.58, precision),
        rounded(Math.max(config.value, previousClose) + intradayMove * 0.73, precision),
      ],
      rangeStatus: config.rangeStatus || 'Within current signal range',
    };

    return {
      symbol: config.symbol,
      aliases: config.aliases || [],
      name: config.name,
      asset: config.asset,
      category: config.category,
      quote,
      ranges: makeRanges(config.symbol, config.value, config.changePct, config.rangeReturns, config.category),
      stats: statistics,
      about: config.about || indexAbout(config),
      methodology: config.methodology || defaultMethodology(config.category, config.name, config.symbol),
      components: config.components || componentSet(config.category, config.name),
      news: config.news || performanceNews(config),
      related: config.related || [],
    };
  }

  const records = [
    makeRecord({
      symbol: 'RMD', name: 'Real Madrid Index', category: 'Clubs', value: 7428.64, changePct: -6.99,
      asset: asset('./public/assets/indices/real-madrid.svg', 'Real Madrid'), volume: '24.8M', related: ['MBP', 'BAR', 'PSG', 'RMD/LMY'],
      about: 'Real Madrid is one of football’s defining institutions, built on European nights, elite players, and a worldwide supporter culture. From the Bernabéu to every away ground, the club carries a familiar mix of ambition, ceremony, and expectation.',
      news: [
        { time: 'Today', source: 'Blackbook Football', title: 'Real Madrid’s European pedigree still sets the tone', summary: 'A club built around big nights, iconic shirts, and a squad expected to compete for every major honour.' },
        { time: 'Yesterday', source: 'Blackbook Football Desk', title: 'Inside the pull of the Bernabéu', summary: 'Matchday theatre, academy roots, and a global fan base keep Madrid larger than any single fixture.' },
      ],
      rangeReturns: [-6.99, -4.41, 7.18, 18.42, 12.76, 26.31, 118.42, 249.16, 312.8],
    }),
    makeRecord({
      symbol: 'LMY', name: 'Lamine Yamal Index', category: 'Athletes', value: 6239.12, changePct: -10.79,
      asset: asset('./public/assets/indices/lamine-profile.jpg', 'Lamine Yamal', 'person'), volume: '18.6M', related: ['BAR', 'MBP', 'RMD', 'RMD/LMY'],
      about: 'Lamine Yamal is Barcelona’s electric right winger, known for close control, quick changes of direction, and a final pass that opens crowded matches. His rapid rise has made him one of football’s most watched young players.',
      news: [
        { time: 'Today', source: 'Blackbook Football', title: 'Lamine Yamal’s creativity is becoming a weekly Barcelona headline', summary: 'The winger’s one-on-one threat and fearless decision-making give Barcelona a distinct edge in the final third.' },
        { time: 'Yesterday', source: 'Blackbook Football Desk', title: 'Why Yamal’s game travels beyond the highlight reel', summary: 'Speed, vision, and an instinct for the decisive moment are turning a prodigy story into a complete player narrative.' },
      ],
      rangeReturns: [-10.79, -7.86, 9.42, 44.8, 36.15, 71.72, 602.27, 684.46, 723.18],
    }),
    makeRecord({
      symbol: 'KDOT', name: 'Kendrick Lamar Index', category: 'Artists', value: 7712.08, changePct: -2.08,
      asset: asset('./public/assets/indices/kendrick-lamar.jpg', 'Kendrick Lamar', 'person'), volume: '15.3M', related: ['DRK', 'ENM', 'SPOT'],
      about: 'Kendrick Lamar is a Compton-born rapper whose albums pair sharp social observation with intricate production and an unusually deliberate visual world. His catalogue moves between intimate storytelling, West Coast history, and huge live-stage moments.',
      news: [
        { time: 'Today', source: 'Blackbook Culture', title: 'Kendrick Lamar’s catalogue keeps rewarding close listening', summary: 'Layered writing, Compton perspective, and a disciplined live show continue to pull listeners back to the records.' },
        { time: 'Yesterday', source: 'Blackbook Music Desk', title: 'The long afterlife of a Kendrick performance', summary: 'A look at how his staging, collaborators, and visual language turn a release into a wider cultural moment.' },
      ],
      rangeReturns: [-2.08, 4.84, 13.51, 31.7, 22.19, 57.44, 602.27, 718.34, 846.12],
    }),
    makeRecord({
      symbol: 'DRK', name: 'Drake Index', category: 'Artists', value: 3489.21, changePct: -7.89,
      asset: asset('./public/assets/indices/drake.jpg', 'Drake', 'person'), volume: '14.2M', related: ['KDOT', 'ENM', 'SPOT'],
      about: 'Drake is a Toronto rapper and singer with a catalogue that moves easily between rap, R&B, dancehall, and pop. OVO collaborations, long-running hitmaking, and a close relationship with his city keep him central to global music conversation.',
      news: [
        { time: 'Today', source: 'Blackbook Culture', title: 'Drake’s Toronto connection remains part of the music', summary: 'OVO collaborations, hometown references, and a deep catalogue keep the artist’s identity tied to the city that raised him.' },
        { time: 'Yesterday', source: 'Blackbook Music Desk', title: 'Why Drake’s back catalogue keeps finding new listeners', summary: 'The mix of rap confessionals, melodic records, and feature-heavy eras gives every generation a different entry point.' },
      ],
      rangeReturns: [-7.89, -3.66, -11.42, -4.18, -13.28, -20.74, 58.3, 141.82, 204.47],
    }),
    makeRecord({
      symbol: 'CGPT', name: 'ChatGPT Index', category: 'Products', value: 8291.44, changePct: 3.53,
      asset: asset('./public/assets/indices/openai-icon.svg', 'ChatGPT'), volume: '21.5M', related: ['CLD', 'IPH', 'MUSK'],
      about: 'ChatGPT is OpenAI’s conversational AI product for writing, research, coding, brainstorming, and everyday questions. Its appeal comes from making a wide range of useful capabilities feel immediate in a single conversation.',
      news: [
        { time: 'Today', source: 'Blackbook Product', title: 'ChatGPT keeps becoming part of the daily workflow', summary: 'Writers, students, developers, and teams continue to use the assistant for first drafts, explanations, and fast iteration.' },
        { time: 'Yesterday', source: 'Blackbook Product Desk', title: 'The useful middle ground between search and software', summary: 'ChatGPT’s strongest moments often come from turning a rough question into a workable next step.' },
      ],
      rangeReturns: [3.53, 6.2, 11.64, 29.58, 24.16, 52.83, 214.4, 426.78, 612.11],
    }),
    makeRecord({
      symbol: 'IPH', name: 'iPhone Index', category: 'Products', value: 7842.19, changePct: 2.11,
      asset: asset('./public/assets/indices/apple.svg', 'iPhone'), volume: '16.8M', related: ['CGPT', 'CLD', 'MUSK'],
      about: 'iPhone is Apple’s flagship smartphone line, where industrial design, cameras, silicon, software, and a vast accessory ecosystem meet. Each generation is judged as both a pocket computer and a familiar cultural object.',
      news: [
        { time: 'Today', source: 'Blackbook Product', title: 'The iPhone story is still about the whole ecosystem', summary: 'Hardware, camera features, iOS, accessories, and services keep the phone connected to the rest of Apple’s everyday experience.' },
        { time: 'Yesterday', source: 'Blackbook Product Desk', title: 'Why each iPhone release becomes a design conversation', summary: 'Small changes in materials, cameras, and software are scrutinised because the product sets the rhythm for the wider smartphone market.' },
      ],
      rangeReturns: [2.11, 5.47, 14.26, 31.88, 27.34, 47.92, 186.51, 384.2, 501.35],
    }),
    makeRecord({
      symbol: 'MBP', name: 'Kylian Mbappé Index', category: 'Athletes', value: 6814.2, changePct: -3.13,
      asset: asset('./public/assets/indices/kylian-mbappe.jpg', 'Kylian Mbappé', 'person'), volume: '17.1M', related: ['RMD', 'LMY', 'BAR', 'PSG'],
      about: 'Kylian Mbappé is a French forward whose acceleration, finishing, and big-game confidence have made him one of football’s defining stars. His career links Paris, Madrid, France, and a global audience that follows every major stage.',
      news: [
        { time: 'Today', source: 'Blackbook Football', title: 'Mbappé remains football’s ultimate transition threat', summary: 'Few forwards turn a single recovery or through ball into danger as quickly, which is why his runs keep shaping the biggest matches.' },
        { time: 'Yesterday', source: 'Blackbook Football Desk', title: 'The many versions of Kylian Mbappé', summary: 'Finisher, creator, captain, and global ambassador: the forward’s story is bigger than a highlight reel.' },
      ],
      rangeReturns: [-3.13, 1.21, 8.47, 26.85, 18.62, 44.31, 173.9, 347.11, 502.8],
    }),
    makeRecord({
      symbol: 'BAR', aliases: ['FCB'], name: 'FC Barcelona Index', category: 'Clubs', value: 6572.8, changePct: 1.62,
      asset: asset('./public/assets/indices/fcb-icon.svg', 'FC Barcelona'), volume: '19.2M', related: ['LMY', 'RMD', 'EPL', 'PSG'],
      about: 'FC Barcelona is a Catalan institution whose identity runs through La Masia, the colours of the Camp Nou, and a style built around technical football. Its history links homegrown players, legendary managers, and one of the sport’s most recognisable supporter cultures.',
      news: [
        { time: 'Today', source: 'Blackbook Football', title: 'Barcelona’s academy remains central to the club’s identity', summary: 'La Masia continues to give the first team a distinctive connection between youth development, technical quality, and local pride.' },
        { time: 'Yesterday', source: 'Blackbook Football Desk', title: 'What makes a Barcelona home match feel different', summary: 'The stadium, the passing culture, and the expectation of expressive football all belong to the same story.' },
      ],
      rangeReturns: [1.62, 4.83, 10.28, 22.6, 17.29, 41.49, 165.16, 292.83, 430.17],
    }),
    makeRecord({
      symbol: 'MUSK', name: 'Elon Musk Index', category: 'Public Figures', value: 5173.73, changePct: -3.13,
      asset: asset('./public/assets/indices/elon-musk.jpg', 'Elon Musk', 'person'), volume: '13.4M', related: ['CGPT', 'IPH', 'CLD'],
      about: 'Elon Musk is an entrepreneur whose work spans electric vehicles, spaceflight, satellite connectivity, and social platforms. His companies and public statements regularly pull technology, business, and online culture into the same conversation.',
      news: [
        { time: 'Today', source: 'Blackbook Technology', title: 'Musk’s companies keep technology and spectacle in the same frame', summary: 'Cars, rockets, satellites, and social platforms give his public story an unusually broad range of subjects.' },
        { time: 'Yesterday', source: 'Blackbook Technology Desk', title: 'The audience around Elon Musk is part of the story', summary: 'Product launches, public posts, and ambitious deadlines are followed as closely as the businesses themselves.' },
      ],
      rangeReturns: [-3.13, 1.84, -6.91, 12.74, 4.63, 29.51, 132.88, 241.77, 309.42],
    }),
    makeRecord({
      symbol: 'EPL', name: 'Premier League Index', category: 'Leagues', value: 6890.52, changePct: 1.22,
      asset: asset('./public/assets/indices/premier-league.svg', 'Premier League'), volume: '20.4M', related: ['ARS', 'RMD', 'BAR', 'PSG'],
      about: 'The Premier League is England’s top-flight football competition, built from famous clubs, packed stadiums, intense local rivalries, and a broadcast audience that spans the world. Its weekly rhythm makes every fixture part of a larger season-long drama.',
      news: [
        { time: 'Today', source: 'Blackbook Football', title: 'The Premier League’s weekly drama remains its superpower', summary: 'Rivalries, promotion stories, title races, and late goals make the competition feel alive from August to May.' },
        { time: 'Yesterday', source: 'Blackbook Football Desk', title: 'Why the Premier League travels so well', summary: 'English grounds, global stars, and familiar club identities give supporters everywhere a way into the same matchday ritual.' },
      ],
      rangeReturns: [1.22, 3.91, 8.52, 21.39, 16.68, 35.11, 148.64, 251.41, 364.85],
    }),
    makeRecord({
      symbol: 'PSG', name: 'Paris Saint-Germain Index', category: 'Clubs', value: 7112.46, changePct: 2.46,
      asset: asset('./public/assets/indices/psg.svg', 'Paris Saint-Germain'), volume: '16.1M', related: ['RMD', 'MBP', 'BAR', 'EPL'],
      about: 'Paris Saint-Germain is the capital’s modern football emblem, with the Parc des Princes, a global fashion sensibility, and a squad built to compete on the biggest stages. The club’s story sits at the intersection of Parisian identity and international star power.',
      news: [
        { time: 'Today', source: 'Blackbook Football', title: 'Paris keeps building a club with its own visual language', summary: 'The crest, the city, the kit, and the Parc des Princes make PSG recognisable far beyond the French league.' },
        { time: 'Yesterday', source: 'Blackbook Football Desk', title: 'The pull of a night at the Parc des Princes', summary: 'Supporters, music, and elite football combine to give Paris home fixtures a distinct sense of occasion.' },
      ],
      rangeReturns: [2.46, 5.12, 12.91, 27.81, 20.95, 48.36, 177.28, 321.56, 468.34],
    }),
    makeRecord({
      symbol: 'ENM', name: 'Eminem Index', category: 'Artists', value: 4182.65, changePct: 1.94,
      asset: asset('./public/assets/indices/eminem-profile.jpg', 'Eminem', 'person'), volume: '11.8M', related: ['KDOT', 'DRK', 'SPOT'],
      about: 'Eminem is a Detroit rapper known for technical precision, dark humour, and a delivery that can turn private struggle into a stadium-sized hook. His catalogue, from early underground work to global albums, has outlasted several eras of hip-hop.',
      news: [
        { time: 'Today', source: 'Blackbook Culture', title: 'Eminem’s technical reputation still starts with the words', summary: 'Internal rhyme, character work, and an unmistakable cadence keep the Detroit rapper’s records in craft conversations.' },
        { time: 'Yesterday', source: 'Blackbook Music Desk', title: 'The records that made Eminem a generational voice', summary: 'A look back at the storytelling, alter egos, and production choices that gave his catalogue such a long afterlife.' },
      ],
      rangeReturns: [1.94, 4.27, 7.81, 18.42, 13.25, 37.26, 109.83, 207.66, 290.12],
    }),
    makeRecord({
      symbol: 'RMD/LMY', name: 'Real Madrid / Lamine Yamal', category: 'Relative Value', value: 1.1907, changePct: 3.08, unit: 'RATIO',
      asset: pairAsset(asset('./public/assets/indices/real-madrid.svg', 'Real Madrid'), asset('./public/assets/indices/lamine-profile.jpg', 'Lamine Yamal', 'person')), volume: '7.8M', related: ['RMD', 'LMY', 'MBP', 'BAR'],
      about: 'Real Madrid and Lamine Yamal represent two sides of football’s next chapter: a club with a century of myth and a young Barcelona star still writing his first pages. Read together, their stories bring heritage, expectation, and breakout talent into the same frame.',
      news: [
        { time: 'Today', source: 'Blackbook Football', title: 'Club legacy meets breakout talent', summary: 'Real Madrid’s established scale and Lamine Yamal’s fearless rise offer two very different ways to read football’s future.' },
        { time: 'Yesterday', source: 'Blackbook Football Desk', title: 'Why Madrid and Yamal make a compelling football contrast', summary: 'One story is built on European history; the other is being formed in real time through youth, imagination, and risk.' },
      ],
      rangeReturns: [3.08, 5.87, 9.14, 17.52, 13.31, 26.61, 74.26, 119.4, 158.71],
    }),
    makeRecord({
      symbol: 'NBA', name: 'NBA Index', category: 'Leagues', value: 6995, changePct: 0.88,
      asset: asset('./public/assets/indices/nba-icon.png', 'NBA'), volume: '18.9M', related: ['LAL', 'BOS', 'KC', 'EPL'],
      about: 'The NBA is a league of distinct cities, star players, inventive offences, and a calendar that turns basketball into a year-round global conversation. Its culture stretches from packed arenas to playgrounds, sneakers, and late-night highlights.',
      news: [
        { time: 'Today', source: 'Blackbook Basketball', title: 'The NBA’s stars keep changing how the game is played', summary: 'Spacing, positionless lineups, and players who create from anywhere on the floor keep each season tactically fresh.' },
        { time: 'Yesterday', source: 'Blackbook Basketball Desk', title: 'Why an NBA night feels bigger than the final score', summary: 'Franchise history, arena rituals, fashion, and highlight culture all travel with the league’s games.' },
      ],
      rangeReturns: [0.88, 3.07, 7.92, 16.44, 11.86, 30.21, 127.82, 219.51, 318.04],
    }),
    makeRecord({
      symbol: 'LAL', name: 'Los Angeles Lakers Index', category: 'Clubs', value: 7104.66, changePct: 2.84,
      asset: asset('./public/assets/indices/los-angeles-lakers.svg', 'Los Angeles Lakers'), volume: '14.7M', related: ['NBA', 'BOS', 'KC'],
      about: 'The Los Angeles Lakers are one of sport’s great entertainment franchises, carrying purple-and-gold history from Minneapolis to Los Angeles. Championship banners, superstar eras, and the Hollywood setting make every Lakers season feel larger than a normal schedule.',
      news: [
        { time: 'Today', source: 'Blackbook Basketball', title: 'The Lakers’ purple-and-gold story still fills the room', summary: 'Legends, banners, and a global fan base mean every new roster is measured against a very long memory.' },
        { time: 'Yesterday', source: 'Blackbook Basketball Desk', title: 'Los Angeles turns a regular game into an event', summary: 'The arena, the city, and the franchise’s celebrity history keep Lakers basketball connected to the wider culture.' },
      ],
      rangeReturns: [2.84, 6.41, 10.24, 25.66, 18.77, 42.86, 144.18, 276.29, 389.8],
    }),
    makeRecord({
      symbol: 'BOS', name: 'Boston Celtics Index', category: 'Clubs', value: 6916.4, changePct: 1.76,
      asset: asset('./public/assets/indices/boston-celtics.svg', 'Boston Celtics'), volume: '13.1M', related: ['NBA', 'LAL', 'KC'],
      about: 'The Boston Celtics carry one of basketball’s richest histories, from parquet-floor tradition to a long line of championship teams. Boston’s identity is direct, demanding, and proudly tied to the city that fills the Garden.',
      news: [
        { time: 'Today', source: 'Blackbook Basketball', title: 'Boston’s basketball identity still begins with the Garden', summary: 'Green banners, a knowledgeable crowd, and a deep championship history give every Celtics era its own standard.' },
        { time: 'Yesterday', source: 'Blackbook Basketball Desk', title: 'The Celtics’ old-school language keeps evolving', summary: 'Defence, passing, and unselfish team play remain part of Boston’s vocabulary even as the modern game speeds up.' },
      ],
      rangeReturns: [1.76, 5.18, 11.63, 23.42, 18.91, 39.72, 138.64, 257.86, 361.14],
    }),
    makeRecord({
      symbol: 'KC', name: 'Kansas City Chiefs Index', category: 'Clubs', value: 6488.32, changePct: 1.47,
      asset: asset('./public/assets/indices/kansas-city-chiefs.svg', 'Kansas City Chiefs'), volume: '12.4M', related: ['DAL', 'EPL', 'NBA'],
      about: 'The Kansas City Chiefs are woven into the sound of Arrowhead Stadium, a fierce red-and-gold identity, and a modern era of high-tempo football. The club’s appeal reaches from Missouri tailgates to a national audience that follows every Sunday.',
      news: [
        { time: 'Today', source: 'Blackbook Football', title: 'Arrowhead remains one of the NFL’s loudest stages', summary: 'The crowd, the colours, and the Chiefs’ aggressive style create a home-field atmosphere that is recognisable before kickoff.' },
        { time: 'Yesterday', source: 'Blackbook Football Desk', title: 'Why Kansas City has become a national football habit', summary: 'Big games, memorable personalities, and a loyal local base have made the Chiefs part of the wider weekly conversation.' },
      ],
      rangeReturns: [1.47, 4.76, 9.87, 19.65, 14.88, 34.72, 123.54, 228.62, 334.25],
    }),
    makeRecord({
      symbol: 'DAL', name: 'Dallas Cowboys Index', category: 'Clubs', value: 5248.91, changePct: -2.68,
      asset: asset('./public/assets/indices/dallas-cowboys.svg', 'Dallas Cowboys'), volume: '12.1M', related: ['KC', 'NBA', 'EPL'],
      about: 'The Dallas Cowboys are an American sports institution with a star-shaped identity, a massive home in Arlington, and supporters far beyond Texas. Their story blends NFL history, spectacle, and the pressure that comes with being football’s most visible brand.',
      news: [
        { time: 'Today', source: 'Blackbook Football', title: 'The Cowboys remain football’s biggest travelling conversation', summary: 'From the star on the helmet to the size of the stadium, Dallas carries a level of attention few franchises can match.' },
        { time: 'Yesterday', source: 'Blackbook Football Desk', title: 'Inside the scale of the Dallas Cowboys', summary: 'History, television, merchandise, and a loyal international following make the Cowboys bigger than any one season.' },
      ],
      rangeReturns: [-2.68, -5.19, -9.46, 6.72, 1.84, 18.46, 82.25, 168.39, 246.77],
    }),
    makeRecord({
      symbol: 'SPOT', name: 'Spotify Index', category: 'Products', value: 7842.55, changePct: 1.84,
      asset: asset('./public/assets/indices/spotify-icon.svg', 'Spotify'), volume: '15.8M', related: ['KDOT', 'DRK', 'ENM', 'CGPT'],
      about: 'Spotify is a global audio platform built around discovery: playlists, podcasts, albums, and the small recommendations that lead listeners to something new. Its relationship with artists and fans makes it part of how modern music is found and remembered.',
      news: [
        { time: 'Today', source: 'Blackbook Product', title: 'Spotify keeps discovery at the centre of listening', summary: 'Personal playlists, editorial curation, and the habits of millions of listeners give every release a new route to an audience.' },
        { time: 'Yesterday', source: 'Blackbook Culture Desk', title: 'Why the playlist has become a cultural format', summary: 'Spotify turns listening into a daily ritual, from a commute mix to the year-end recap shared across social feeds.' },
      ],
      rangeReturns: [1.84, 4.92, 12.33, 28.64, 20.72, 43.87, 156.63, 301.48, 417.3],
    }),
    makeRecord({
      symbol: 'CLD', name: 'Claude Index', category: 'Products', value: 8763.4, changePct: 2.9,
      asset: asset('./public/assets/indices/claude-icon.jpg', 'Claude'), volume: '17.6M', related: ['CGPT', 'IPH', 'MUSK'],
      about: 'Claude is Anthropic’s AI assistant, designed for thoughtful writing, analysis, coding, and long-form work. Its reputation is tied to a calm conversational style, careful reasoning, and the ability to stay useful across complex tasks.',
      news: [
        { time: 'Today', source: 'Blackbook Technology', title: 'Claude is finding its lane in long-form work', summary: 'Researchers, writers, and developers value the assistant when a task needs context, structure, and a measured answer.' },
        { time: 'Yesterday', source: 'Blackbook Technology Desk', title: 'The appeal of a quieter AI assistant', summary: 'Claude’s restrained tone and focus on useful reasoning give it a distinct place in a crowded AI field.' },
      ],
      rangeReturns: [2.9, 5.63, 13.14, 31.9, 25.81, 55.18, 223.75, 443.21, 628.9],
    }),
    makeRecord({
      symbol: 'ARS', name: 'Arsenal Index', category: 'Clubs', value: 5604.18, changePct: -2.88,
      asset: asset('./public/assets/indices/arsenal.svg', 'Arsenal'), volume: '10.9M', related: ['EPL', 'RMD', 'BAR', 'PSG'],
      about: 'Arsenal is a north London football club with a recognisable red-and-white identity, a deep tradition of elegant attacking football, and supporters around the world. The Emirates is home to a team whose ambition is always measured against the club’s history.',
      news: [
        { time: 'Today', source: 'Blackbook Football', title: 'Arsenal’s red-and-white identity still travels globally', summary: 'The club’s style, north London roots, and loyal international following make every new campaign feel connected to a longer story.' },
        { time: 'Yesterday', source: 'Blackbook Football Desk', title: 'The Emirates as a stage for Arsenal’s next chapter', summary: 'Youth, technical football, and the expectation of competing at the top continue to define the atmosphere around the club.' },
      ],
      rangeReturns: [-2.88, -1.76, 5.92, 14.34, 9.48, 26.81, 96.24, 184.57, 271.48],
    }),
    makeRecord({
      symbol: 'LIV', name: 'Liverpool Index', category: 'Clubs', value: 7184.32, changePct: 6.14,
      asset: asset('./public/assets/indices/liverpool-crest.svg', 'Liverpool'), volume: '18.3M', related: ['EPL', 'MCI', 'MNU', 'ARS'],
      about: 'Liverpool is a football club shaped by Anfield, a fiercely loyal supporter culture, and a history of domestic and European nights. The red shirt, the Kop, and an aggressive tradition of front-foot football give the club an identity recognised far beyond Merseyside.',
      news: [
        { time: 'Today', source: 'Blackbook Football', title: 'Liverpool’s tempo lifts as Anfield momentum builds', summary: 'Fast transitions, pressure high up the pitch, and a crowd that responds to intensity have pushed Liverpool back into the centre of the football conversation.' },
        { time: 'Yesterday', source: 'Blackbook Football Desk', title: 'Why Liverpool’s biggest nights still begin in the stands', summary: 'The connection between the team and the Kop remains one of the club’s strongest competitive and cultural advantages.' },
      ],
      rangeReturns: [6.14, 8.72, 15.31, 31.44, 24.08, 48.63, 169.42, 318.55, 446.18],
    }),
    makeRecord({
      symbol: 'MCI', name: 'Manchester City Index', category: 'Clubs', value: 7118.26, changePct: 3.12,
      asset: asset('./public/assets/indices/manchester-city.svg', 'Manchester City'), volume: '17.4M', related: ['EPL', 'LIV', 'MNU', 'ARS'],
      about: 'Manchester City are a modern football power built around technical control, deep squads, and a precise positional style. From the Etihad to their global academy network, the club’s identity is tied to sustained ambition and an expectation of competing for every major trophy.',
      news: [
        { time: 'Today', source: 'Blackbook Football', title: 'Manchester City’s control game keeps setting the pace', summary: 'Possession, movement between the lines, and strength across the squad continue to make City one of football’s most difficult teams to disrupt.' },
        { time: 'Yesterday', source: 'Blackbook Football Desk', title: 'The Etihad era has changed City’s global scale', summary: 'Domestic success, European ambition, and a recognisable playing style have expanded the club’s audience well beyond Manchester.' },
      ],
      rangeReturns: [3.12, 6.48, 12.76, 27.31, 20.42, 44.18, 151.74, 289.63, 401.82],
    }),
    makeRecord({
      symbol: 'MNU', name: 'Manchester United Index', category: 'Clubs', value: 6284.47, changePct: -1.86,
      asset: asset('./public/assets/indices/manchester-united.svg', 'Manchester United'), volume: '16.7M', related: ['EPL', 'MCI', 'LIV', 'ARS'],
      about: 'Manchester United are one of football’s most widely followed clubs, carrying the history of Old Trafford, generations of academy players, and a global red-shirted support. Every United era is judged against a tradition of attacking football, major trophies, and dramatic comebacks.',
      news: [
        { time: 'Today', source: 'Blackbook Football', title: 'Manchester United’s rebuild remains under a global spotlight', summary: 'Squad decisions, academy opportunities, and performances at Old Trafford continue to draw attention on a scale few clubs experience.' },
        { time: 'Yesterday', source: 'Blackbook Football Desk', title: 'Old Trafford still carries the weight of United history', summary: 'The stadium, the supporters, and memories of title-winning sides keep expectations high through every new chapter.' },
      ],
      rangeReturns: [-1.86, 2.14, 6.83, 11.62, 7.44, 19.85, 91.28, 176.42, 258.17],
    }),
    makeRecord({
      symbol: 'LBJ', name: 'LeBron James Index', category: 'Athletes', value: 7536.2, changePct: 4.87,
      asset: asset('./public/assets/indices/lebron-profile.jpg', 'LeBron James', 'person'), volume: '19.1M', related: ['LAL', 'NBA', 'MBP', 'LMY'],
      about: 'LeBron James is a basketball forward whose combination of power, vision, scoring, and longevity has defined an era of the NBA. His career spans championship teams, deep playoff runs, and an influence that reaches into media, business, and athlete empowerment.',
      news: [
        { time: 'Today', source: 'Blackbook Basketball', title: 'LeBron James keeps extending the limits of basketball longevity', summary: 'Playmaking, physical preparation, and the ability to control a game in different ways continue to keep James central to the Lakers’ season.' },
        { time: 'Yesterday', source: 'Blackbook Basketball Desk', title: 'Why LeBron’s influence reaches beyond the box score', summary: 'Leadership, media attention, and two decades of defining moments make every new milestone part of a much larger career story.' },
      ],
      rangeReturns: [4.87, 7.96, 14.25, 29.83, 23.16, 52.48, 184.37, 352.62, 496.14],
    }),
    makeRecord({
      symbol: 'VJR', name: 'Vinícius Júnior Index', category: 'Athletes', value: 6094.37, changePct: 2.67,
      asset: asset('./public/assets/indices/vinicius-junior.jpg', 'Vinícius Júnior', 'person'), volume: '16.2M', related: ['RMD', 'MBP', 'LMY', 'BJL'],
      about: 'Vinícius Júnior is a Brazilian winger whose acceleration, direct dribbling, and appetite for decisive moments make him one of Real Madrid’s most dangerous attackers. His game is built around stretching defences, attacking space, and turning major matches with individual invention.',
      news: [
        { time: 'Today', source: 'Blackbook Football', title: 'Vinícius Júnior’s direct running keeps Madrid dangerous', summary: 'Explosive changes of pace and the confidence to attack defenders repeatedly continue to shape Real Madrid’s threat from the left.' },
        { time: 'Yesterday', source: 'Blackbook Football Desk', title: 'Vini’s biggest moments have become part of the Madrid rhythm', summary: 'His willingness to demand the ball under pressure has turned raw speed into a dependable presence on major nights.' },
      ],
      rangeReturns: [2.67, 5.41, 11.82, 28.74, 21.33, 49.65, 196.42, 381.18, 548.72],
    }),
    makeRecord({
      symbol: 'HLD', name: 'Erling Haaland Index', category: 'Athletes', value: 6321.55, changePct: 3.84,
      asset: asset('./public/assets/indices/erling-haaland.jpg', 'Erling Haaland', 'person'), volume: '17.8M', related: ['MCI', 'EPL', 'MBP', 'VJR'],
      about: 'Erling Haaland is a Norwegian striker defined by speed, strength, ruthless movement, and an extraordinary appetite for goals. His ability to arrive in the right space with minimal touches gives Manchester City a direct edge inside even the most crowded penalty area.',
      news: [
        { time: 'Today', source: 'Blackbook Football', title: 'Haaland’s penalty-area movement drives another surge in attention', summary: 'Sharp runs between defenders and a relentless focus on finishing keep the striker at the centre of Manchester City’s attack.' },
        { time: 'Yesterday', source: 'Blackbook Football Desk', title: 'The simplicity behind Haaland’s spectacular numbers', summary: 'Timing, physical power, and a clear understanding of space allow him to turn brief openings into decisive chances.' },
      ],
      rangeReturns: [3.84, 7.13, 13.46, 33.58, 26.21, 58.72, 219.54, 428.16, 611.83],
    }),
    makeRecord({
      symbol: 'BJL', name: 'Jude Bellingham Index', category: 'Athletes', value: 6118.74, changePct: 1.92,
      asset: asset('./public/assets/indices/jude-bellingham.jpg', 'Jude Bellingham', 'person'), volume: '15.4M', related: ['RMD', 'VJR', 'MBP', 'LMY'],
      about: 'Jude Bellingham is an English midfielder whose range, composure, and late movement into the box allow him to influence matches at both ends. At Real Madrid he combines technical quality with emotional presence, often taking responsibility in the game’s most demanding moments.',
      news: [
        { time: 'Today', source: 'Blackbook Football', title: 'Bellingham’s all-action role keeps expanding at Madrid', summary: 'Ball carrying, defensive work, and intelligent arrivals around the box give the midfielder several ways to change a match.' },
        { time: 'Yesterday', source: 'Blackbook Football Desk', title: 'Why Bellingham looks comfortable on football’s largest stages', summary: 'Composure and a willingness to take responsibility have made him a natural focal point for club and country.' },
      ],
      rangeReturns: [1.92, 4.86, 10.57, 25.33, 18.96, 43.12, 174.84, 336.72, 481.35],
    }),
    makeRecord({
      symbol: 'JBI', name: 'Justin Bieber Index', category: 'Artists', value: 6908.44, changePct: 7.31,
      asset: asset('./public/assets/indices/justin-bieber.jpg', 'Justin Bieber', 'person'), volume: '13.9M', related: ['TSWT', 'WKND', 'BNNY', 'SPOT'],
      about: 'Justin Bieber is a Canadian singer whose career moved from teenage pop phenomenon to a catalogue spanning acoustic confessionals, electronic collaborations, R&B, and arena-sized hooks. His voice and constant stylistic shifts have kept him connected to several generations of listeners.',
      news: [
        { time: 'Today', source: 'Blackbook Music', title: 'Justin Bieber’s catalogue finds another wave of listeners', summary: 'Pop staples, collaborative records, and more intimate songs continue to give listeners several different entry points into his work.' },
        { time: 'Yesterday', source: 'Blackbook Music Desk', title: 'Why Bieber’s collaborations keep travelling across genres', summary: 'His ability to move between pop, R&B, dance, and acoustic writing has made collaboration a lasting part of his catalogue.' },
      ],
      rangeReturns: [7.31, 10.82, 18.44, 36.72, 29.16, 61.35, 208.74, 397.12, 559.86],
    }),
    makeRecord({
      symbol: 'TSWT', name: 'Taylor Swift Index', category: 'Artists', value: 7144.02, changePct: -6.57,
      asset: asset('./public/assets/indices/taylor-swift.jpg', 'Taylor Swift', 'person'), volume: '20.2M', related: ['BNYC', 'WKND', 'JBI', 'SPOT'],
      about: 'Taylor Swift is an American songwriter whose work moves between country storytelling, polished pop, indie textures, and large-scale stadium performance. Her detailed writing, re-recorded catalogue, and close relationship with listeners have made each era feel like its own cultural event.',
      news: [
        { time: 'Today', source: 'Blackbook Music', title: 'Taylor Swift’s catalogue remains active across multiple eras', summary: 'Early songwriting, pop reinventions, and later studio experiments continue to attract listeners who enter the catalogue from different directions.' },
        { time: 'Yesterday', source: 'Blackbook Music Desk', title: 'How Swift turned the album era into a shared language', summary: 'Visual clues, live staging, and narrative continuity have made each release cycle part of a longer conversation with fans.' },
      ],
      rangeReturns: [-6.57, -3.84, 8.26, 24.93, 18.65, 47.31, 244.82, 486.25, 692.41],
    }),
    makeRecord({
      symbol: 'BNYC', name: 'Beyoncé Index', category: 'Artists', value: 6904.18, changePct: 3.53,
      asset: asset('./public/assets/indices/beyonce.jpg', 'Beyoncé', 'person'), volume: '18.7M', related: ['TSWT', 'WKND', 'KDOT', 'SPOT'],
      about: 'Beyoncé is an American singer, performer, and creative director whose catalogue combines vocal precision, ambitious visual work, dance music, R&B, and deep engagement with Black musical traditions. Her live shows are known for discipline, scale, and exacting detail.',
      news: [
        { time: 'Today', source: 'Blackbook Music', title: 'Beyoncé’s performance catalogue keeps rewarding close attention', summary: 'Vocal arrangements, choreography, and visual detail give both new work and older records renewed life with every major performance.' },
        { time: 'Yesterday', source: 'Blackbook Music Desk', title: 'Why every Beyoncé era expands the frame', summary: 'Her albums connect sound, imagery, history, and live presentation into projects designed to be experienced as complete worlds.' },
      ],
      rangeReturns: [3.53, 7.24, 14.68, 32.46, 25.14, 55.82, 231.47, 452.19, 641.38],
    }),
    makeRecord({
      symbol: 'WKND', name: 'The Weeknd Index', category: 'Artists', value: 5987.34, changePct: 6.1,
      asset: asset('./public/assets/indices/the-weeknd.jpg', 'The Weeknd', 'person'), volume: '16.9M', related: ['JBI', 'BNYC', 'DRK', 'SPOT'],
      about: 'The Weeknd is a Canadian singer and producer whose music blends nocturnal R&B, synth-pop, and cinematic world-building. A distinctive high register, carefully linked album eras, and a catalogue of global pop records have made his sound immediately recognisable.',
      news: [
        { time: 'Today', source: 'Blackbook Music', title: 'The Weeknd’s dark pop catalogue returns to the foreground', summary: 'Atmospheric early work and later stadium-scale singles continue to reinforce the contrast at the centre of his sound.' },
        { time: 'Yesterday', source: 'Blackbook Music Desk', title: 'How The Weeknd built one continuous cinematic world', summary: 'Recurring characters, neon imagery, and carefully sequenced albums connect more than a decade of releases.' },
      ],
      rangeReturns: [6.1, 9.54, 17.36, 38.24, 30.82, 64.73, 238.16, 467.92, 659.48],
    }),
    makeRecord({
      symbol: 'BNNY', name: 'Bad Bunny Index', category: 'Artists', value: 6386.4, changePct: 8.13,
      asset: asset('./public/assets/indices/bad-bunny.jpg', 'Bad Bunny', 'person'), volume: '17.5M', related: ['JBI', 'TSWT', 'TRVS', 'SPOT'],
      about: 'Bad Bunny is a Puerto Rican artist whose music stretches reggaeton and Latin trap into pop, house, rock, and distinctly Caribbean forms. His conversational delivery, adventurous production, and commitment to Puerto Rican identity have helped Spanish-language music command a truly global audience.',
      news: [
        { time: 'Today', source: 'Blackbook Music', title: 'Bad Bunny’s Puerto Rican sound keeps travelling globally', summary: 'Local references, rhythmic experimentation, and an instinct for massive hooks continue to connect island identity with worldwide audiences.' },
        { time: 'Yesterday', source: 'Blackbook Music Desk', title: 'Why Bad Bunny’s genre shifts still sound personal', summary: 'Reggaeton, trap, house, and rock influences sit inside a voice that remains recognisably his own.' },
      ],
      rangeReturns: [8.13, 12.47, 20.84, 43.15, 35.72, 72.61, 268.34, 519.72, 734.16],
    }),
    makeRecord({
      symbol: 'KWST', name: 'Kanye West Index', category: 'Artists', value: 4997.52, changePct: -19.1,
      asset: asset('./public/assets/indices/kanye-west.jpg', 'Kanye West', 'person'), volume: '15.1M', related: ['TRVS', 'DRK', 'KDOT', 'SPOT'],
      about: 'Kanye West is an American producer and rapper whose work reshaped hip-hop through soul sampling, electronic minimalism, maximalist studio craft, and unusually public reinvention. His catalogue remains influential even as his public life has become increasingly divisive and unpredictable.',
      news: [
        { time: 'Today', source: 'Blackbook Music', title: 'Kanye West’s catalogue and public volatility pull in opposite directions', summary: 'Landmark production and enduring albums continue to attract listeners while controversy keeps reshaping the wider conversation around his work.' },
        { time: 'Yesterday', source: 'Blackbook Music Desk', title: 'The production ideas that still echo through modern rap', summary: 'Sampling choices, abrupt aesthetic changes, and a willingness to rebuild his sound have influenced several generations of artists.' },
      ],
      rangeReturns: [-19.1, -14.62, -7.84, 9.36, 2.48, 21.72, 104.83, 203.46, 287.15],
    }),
    makeRecord({
      symbol: 'TRVS', name: 'Travis Scott Index', category: 'Artists', value: 5604.33, changePct: -7.76,
      asset: asset('./public/assets/indices/travis-scott.jpg', 'Travis Scott', 'person'), volume: '14.8M', related: ['KWST', 'DRK', 'BNNY', 'SPOT'],
      about: 'Travis Scott is an American rapper and producer known for psychedelic trap production, dense vocal textures, and concerts designed as immersive spectacles. His albums favour atmosphere and scale, while collaborations connect his sound to fashion, sneakers, and youth culture.',
      news: [
        { time: 'Today', source: 'Blackbook Music', title: 'Travis Scott’s live scale remains central to his appeal', summary: 'Layered production, visual spectacle, and a catalogue built for large crowds continue to define how audiences experience his music.' },
        { time: 'Yesterday', source: 'Blackbook Music Desk', title: 'Inside the production world behind the Travis Scott sound', summary: 'Distorted synths, stacked vocals, and carefully placed collaborators turn individual tracks into part of a wider atmosphere.' },
      ],
      rangeReturns: [-7.76, -4.82, 5.16, 19.42, 13.58, 36.91, 148.26, 291.74, 416.83],
    }),
    makeRecord({
      symbol: 'DOJA', name: 'Doja Cat Index', category: 'Artists', value: 4286.17, changePct: -5.72,
      asset: asset('./public/assets/indices/doja-cat.jpg', 'Doja Cat', 'person'), volume: '11.7M', related: ['TSWT', 'BNYC', 'JBI', 'SPOT'],
      about: 'Doja Cat is an American rapper, singer, and performer whose work moves quickly between sharp rap writing, elastic pop melodies, internet humour, and theatrical visual identities. Her versatility allows a single project to hold club records, character pieces, and technically focused performances.',
      news: [
        { time: 'Today', source: 'Blackbook Music', title: 'Doja Cat’s versatility keeps listeners guessing', summary: 'Rap-heavy performances, pop instincts, and playful visual shifts make each new appearance difficult to place in only one category.' },
        { time: 'Yesterday', source: 'Blackbook Music Desk', title: 'The technical edge beneath Doja Cat’s pop instincts', summary: 'Quick flows, vocal control, and precise comic timing give her records a stronger foundation than viral moments alone.' },
      ],
      rangeReturns: [-5.72, -2.36, 4.91, 16.74, 10.82, 29.65, 126.48, 244.19, 352.73],
    }),
    makeRecord({
      symbol: 'FTR', name: 'Future Index', category: 'Artists', value: 4740.08, changePct: -5.39,
      asset: asset('./public/assets/indices/future.jpg', 'Future', 'person'), volume: '13.6M', related: ['DRK', 'TRVS', 'KWST', 'SPOT'],
      about: 'Future is an American rapper whose melodic delivery, bruised writing, and prolific mixtape-to-album run helped define modern trap. His voice can sound detached, triumphant, or vulnerable, giving a large catalogue a consistent emotional atmosphere.',
      news: [
        { time: 'Today', source: 'Blackbook Music', title: 'Future’s deep catalogue continues to shape trap’s vocabulary', summary: 'Melodic phrasing, producer chemistry, and a steady stream of influential records keep his sound embedded in contemporary rap.' },
        { time: 'Yesterday', source: 'Blackbook Music Desk', title: 'Why Future’s most imitated quality is still hard to copy', summary: 'The tension between confidence and vulnerability gives familiar trap structures a voice that remains distinctly his.' },
      ],
      rangeReturns: [-5.39, -1.92, 6.37, 18.55, 12.41, 33.28, 141.86, 278.43, 397.64],
    }),
    makeRecord({
      symbol: 'CCEE', name: 'Central Cee Index', category: 'Artists', value: 3918.75, changePct: -4.98,
      asset: asset('./public/assets/indices/central-cee.jpg', 'Central Cee', 'person'), volume: '10.8M', related: ['DRK', 'KDOT', 'TRVS', 'SPOT'],
      about: 'Central Cee is a British rapper whose clipped delivery, direct writing, and ear for concise hooks have carried UK drill into a broader international pop audience. His records keep a recognisable west London perspective even as the collaborations and stages become larger.',
      news: [
        { time: 'Today', source: 'Blackbook Music', title: 'Central Cee keeps widening the audience for UK rap', summary: 'Short, direct records and cross-border collaborations continue to move his west London voice into new markets.' },
        { time: 'Yesterday', source: 'Blackbook Music Desk', title: 'The economy behind Central Cee’s writing style', summary: 'Compact verses, clear images, and controlled delivery allow his songs to travel without losing their local point of view.' },
      ],
      rangeReturns: [-4.98, -1.64, 7.12, 21.46, 15.73, 39.84, 169.32, 326.75, 468.21],
    }),
    makeRecord({
      symbol: 'TYLA', name: 'Tyla Index', category: 'Artists', value: 5738.46, changePct: 5.42,
      asset: asset('./public/assets/indices/tyla-profile.png', 'Tyla', 'person'), volume: '14.6M', related: ['SPOT', 'DRK', 'BNNY', 'TSWT'],
      about: 'Tyla is a Johannesburg-born singer whose music carries amapiano into a bright global pop language. Her elastic vocals, rhythmic movement, and instinct for a hook have made songs like “Water” part of a much wider dance and culture conversation.',
      news: [
        { time: 'Today', source: 'Blackbook Music', title: 'Tyla keeps widening the world around amapiano pop', summary: 'A flexible voice, kinetic performance style, and a sharp feel for rhythm continue to connect Johannesburg roots with a global audience.' },
        { time: 'Yesterday', source: 'Blackbook Music Desk', title: 'Why Tyla’s songs travel beyond the dance floor', summary: 'Her records pair memorable movement with a clear melodic identity, giving listeners an entry point whether they arrive through pop, R&B, or amapiano.' },
      ],
      rangeReturns: [5.42, 8.76, 16.38, 28.94, 23.41, 61.2, 205.4, 382.7, 540.9],
    }),
  ];

  const aliases = new Map();
  records.forEach((record) => {
    const keys = [record.symbol, ...record.aliases];
    keys.forEach((key) => {
      const normalized = String(key).toUpperCase().replace(/\s+/g, '');
      aliases.set(normalized, record);
      aliases.set(`${normalized}/USD`, record);
      aliases.set(`${normalized}USD`, record);
    });
  });
  aliases.set('RMDLMY', aliases.get('RMD/LMY'));

  function normalizeSymbol(value) {
    if (typeof value !== 'string') return '';
    try {
      return decodeURIComponent(value).trim().toUpperCase().replace(/\s+/g, '');
    } catch {
      return value.trim().toUpperCase().replace(/\s+/g, '');
    }
  }

  function getIndex(value) {
    const normalized = normalizeSymbol(value);
    return aliases.get(normalized) || null;
  }

  global.BLACKBOOK_INDEX_CATALOG = Object.freeze({
    list: Object.freeze(records),
    bySymbol: Object.freeze(Object.fromEntries(records.map((record) => [record.symbol, record]))),
    rangeOrder: Object.freeze([...RANGE_ORDER]),
    normalizeSymbol,
    get: getIndex,
  });
}(window));
