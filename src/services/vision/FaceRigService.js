/**
 * Computer Vision Face Rigging and Landmarker Configuration Service.
 * Calibrated using MediaPipe Face Mesh landmark indices across female.png and male.png.
 * All coordinates normalized in UV space [0.0, 1.0] (where 0,0 is bottom-left, 1,1 is top-right).
 */

export const FACE_RIGS = {
  female: {
    id: 'female_rig',
    gender: 'female',
    faceBounds: {
      xMin: 0.36,
      xMax: 0.64,
      yMin: 0.30,
      yMax: 0.88
    },
    eyes: {
      left: { x: 0.448, y: 0.635, irisIndex: 468 },
      right: { x: 0.552, y: 0.635, irisIndex: 473 },
      interPupillaryDistance: 0.104
    },
    eyebrows: {
      left: { x: 0.450, y: 0.690 },
      right: { x: 0.550, y: 0.688 }
    },
    nose: {
      tip: { x: 0.501, y: 0.535, index: 4 },
      base: { x: 0.501, y: 0.510 }
    },
    mouth: {
      center: { x: 0.502, y: 0.442, apertureIndex: 13 },
      upperLipTop: { x: 0.502, y: 0.465, index: 0 },
      lowerLipBottom: { x: 0.502, y: 0.410, index: 17 },
      cornerLeft: { x: 0.452, y: 0.445, index: 61 },
      cornerRight: { x: 0.552, y: 0.445, index: 291 },
      width: 0.100,
      restingHeight: 0.055,
      bounds: {
        xMin: 0.43,
        xMax: 0.57,
        yMin: 0.38,
        yMax: 0.49
      }
    },
    jaw: {
      chin: { x: 0.502, y: 0.360, index: 152 },
      jawLeft: { x: 0.400, y: 0.420 },
      jawRight: { x: 0.600, y: 0.420 }
    },
    cheeks: {
      left: { x: 0.410, y: 0.540, index: 205 },
      right: { x: 0.590, y: 0.540, index: 425 }
    }
  },

  male: {
    id: 'male_rig',
    gender: 'male',
    faceBounds: {
      xMin: 0.35,
      xMax: 0.65,
      yMin: 0.29,
      yMax: 0.89
    },
    eyes: {
      left: { x: 0.445, y: 0.630, irisIndex: 468 },
      right: { x: 0.554, y: 0.632, irisIndex: 473 },
      interPupillaryDistance: 0.109
    },
    eyebrows: {
      left: { x: 0.446, y: 0.686 },
      right: { x: 0.552, y: 0.684 }
    },
    nose: {
      tip: { x: 0.500, y: 0.538, index: 4 },
      base: { x: 0.500, y: 0.512 }
    },
    mouth: {
      center: { x: 0.500, y: 0.444, apertureIndex: 13 },
      upperLipTop: { x: 0.500, y: 0.462, index: 0 },
      lowerLipBottom: { x: 0.500, y: 0.412, index: 17 },
      cornerLeft: { x: 0.448, y: 0.446, index: 61 },
      cornerRight: { x: 0.552, y: 0.446, index: 291 },
      width: 0.104,
      restingHeight: 0.050,
      bounds: {
        xMin: 0.42,
        xMax: 0.58,
        yMin: 0.38,
        yMax: 0.49
      }
    },
    jaw: {
      chin: { x: 0.500, y: 0.355, index: 152 },
      jawLeft: { x: 0.395, y: 0.415 },
      jawRight: { x: 0.605, y: 0.415 }
    },
    cheeks: {
      left: { x: 0.405, y: 0.535, index: 205 },
      right: { x: 0.595, y: 0.535, index: 425 }
    }
  }
};

/**
 * Returns calibrated face rig configuration for specified gender.
 */
export const getFaceRig = (gender) => {
  return FACE_RIGS[gender] || FACE_RIGS.female;
};
