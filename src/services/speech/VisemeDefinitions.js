/**
 * Viseme definitions and facial morph target weights for organic human speech.
 * Conforms to standardized facial blendshape standards (ARKit / FACS).
 */

export const VISEMES = {
  SILENCE: {
    name: 'silence',
    jawOpen: 0.0,
    lipWidth: 0.0,
    lipPucker: 0.0,
    upperLipRaise: 0.0,
    lowerLipDepress: 0.0,
    lipClose: 0.0,
    mouthCornerPull: 0.0,
    chinRaise: 0.0
  },
  AA: { // father, start, background
    name: 'AA',
    jawOpen: 0.68,
    lipWidth: 0.12,
    lipPucker: 0.0,
    upperLipRaise: 0.22,
    lowerLipDepress: 0.52,
    lipClose: 0.0,
    mouthCornerPull: 0.08,
    chinRaise: -0.18
  },
  E: { // bed, get, developer
    name: 'E',
    jawOpen: 0.38,
    lipWidth: 0.38,
    lipPucker: 0.0,
    upperLipRaise: 0.28,
    lowerLipDepress: 0.32,
    lipClose: 0.0,
    mouthCornerPull: 0.32,
    chinRaise: -0.08
  },
  I: { // meet, lead, experience
    name: 'I',
    jawOpen: 0.24,
    lipWidth: 0.48,
    lipPucker: 0.0,
    upperLipRaise: 0.24,
    lowerLipDepress: 0.20,
    lipClose: 0.0,
    mouthCornerPull: 0.40,
    chinRaise: 0.0
  },
  O: { // go, role, project
    name: 'O',
    jawOpen: 0.55,
    lipWidth: -0.30,
    lipPucker: 0.62,
    upperLipRaise: 0.16,
    lowerLipDepress: 0.36,
    lipClose: 0.0,
    mouthCornerPull: -0.18,
    chinRaise: -0.1
  },
  U: { // you, solution, through
    name: 'U',
    jawOpen: 0.30,
    lipWidth: -0.42,
    lipPucker: 0.88,
    upperLipRaise: 0.14,
    lowerLipDepress: 0.18,
    lipClose: 0.0,
    mouthCornerPull: -0.32,
    chinRaise: 0.12
  },
  MBP: { // my, problem, backend
    name: 'MBP',
    jawOpen: 0.02,
    lipWidth: 0.06,
    lipPucker: 0.0,
    upperLipRaise: -0.06,
    lowerLipDepress: -0.06,
    lipClose: 1.0,
    mouthCornerPull: 0.0,
    chinRaise: 0.26
  },
  FV: { // focus, value, interview
    name: 'FV',
    jawOpen: 0.16,
    lipWidth: 0.18,
    lipPucker: 0.0,
    upperLipRaise: 0.14,
    lowerLipDepress: -0.12,
    lipClose: 0.42,
    mouthCornerPull: 0.14,
    chinRaise: 0.28
  },
  TH: { // think, strengths, with
    name: 'TH',
    jawOpen: 0.20,
    lipWidth: 0.16,
    lipPucker: 0.0,
    upperLipRaise: 0.18,
    lowerLipDepress: 0.18,
    lipClose: 0.0,
    mouthCornerPull: 0.10,
    chinRaise: 0.0
  },
  L: { // learn, scale, level
    name: 'L',
    jawOpen: 0.32,
    lipWidth: 0.10,
    lipPucker: 0.0,
    upperLipRaise: 0.20,
    lowerLipDepress: 0.28,
    lipClose: 0.0,
    mouthCornerPull: 0.08,
    chinRaise: 0.0
  },
  SZ: { // system, software, design
    name: 'SZ',
    jawOpen: 0.16,
    lipWidth: 0.32,
    lipPucker: 0.0,
    upperLipRaise: 0.20,
    lowerLipDepress: 0.18,
    lipClose: 0.0,
    mouthCornerPull: 0.26,
    chinRaise: 0.04
  },
  SHCH: { // challenge, architecture, should
    name: 'SHCH',
    jawOpen: 0.28,
    lipWidth: -0.20,
    lipPucker: 0.52,
    upperLipRaise: 0.22,
    lowerLipDepress: 0.24,
    lipClose: 0.0,
    mouthCornerPull: -0.14,
    chinRaise: 0.1
  },
  KG: { // code, background, grow
    name: 'KG',
    jawOpen: 0.42,
    lipWidth: 0.04,
    lipPucker: 0.0,
    upperLipRaise: 0.16,
    lowerLipDepress: 0.34,
    lipClose: 0.0,
    mouthCornerPull: 0.04,
    chinRaise: -0.08
  },
  NDT: { // data, network, decision
    name: 'NDT',
    jawOpen: 0.22,
    lipWidth: 0.14,
    lipPucker: 0.0,
    upperLipRaise: 0.18,
    lowerLipDepress: 0.20,
    lipClose: 0.0,
    mouthCornerPull: 0.10,
    chinRaise: 0.0
  },
  R: { // role, recent, right
    name: 'R',
    jawOpen: 0.26,
    lipWidth: -0.14,
    lipPucker: 0.28,
    upperLipRaise: 0.14,
    lowerLipDepress: 0.18,
    lipClose: 0.0,
    mouthCornerPull: -0.04,
    chinRaise: 0.04
  }
};

/**
 * Phoneme/Grapheme to viseme rules for English words.
 */
export const wordToVisemeList = (word) => {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return ['SILENCE'];

  const visemes = [];
  let i = 0;
  while (i < clean.length) {
    const two = clean.slice(i, i + 2);
    const three = clean.slice(i, i + 3);

    if (three === 'ing') {
      visemes.push('I', 'KG');
      i += 3;
    } else if (two === 'th') {
      visemes.push('TH');
      i += 2;
    } else if (two === 'sh' || two === 'ch') {
      visemes.push('SHCH');
      i += 2;
    } else if (two === 'ee' || two === 'ea') {
      visemes.push('I');
      i += 2;
    } else if (two === 'oo') {
      visemes.push('U');
      i += 2;
    } else if (two === 'ou' || two === 'ow') {
      visemes.push('AA', 'U');
      i += 2;
    } else if (two === 'ai' || two === 'ay') {
      visemes.push('E', 'I');
      i += 2;
    } else if (two === 'oa') {
      visemes.push('O');
      i += 2;
    } else if (two === 'ph') {
      visemes.push('FV');
      i += 2;
    } else if (two === 'ck') {
      visemes.push('KG');
      i += 2;
    } else {
      const c = clean[i];
      switch (c) {
        case 'a': visemes.push('AA'); break;
        case 'e': visemes.push('E'); break;
        case 'i': case 'y': visemes.push('I'); break;
        case 'o': visemes.push('O'); break;
        case 'u': visemes.push('U'); break;
        case 'b': case 'm': case 'p': visemes.push('MBP'); break;
        case 'f': case 'v': visemes.push('FV'); break;
        case 'l': visemes.push('L'); break;
        case 's': case 'z': case 'c': visemes.push('SZ'); break;
        case 'j': visemes.push('SHCH'); break;
        case 'k': case 'g': case 'q': visemes.push('KG'); break;
        case 'd': case 'n': case 't': visemes.push('NDT'); break;
        case 'r': visemes.push('R'); break;
        case 'w': visemes.push('U'); break;
        default: visemes.push('E'); break;
      }
      i++;
    }
  }

  return visemes.length > 0 ? visemes : ['E'];
};
