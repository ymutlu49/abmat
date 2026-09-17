// ABMATO — etkinlik → öğrenme yörüngesi eşlemesi (otomatik ilk-geçiş; uzman gözden geçirebilir).
// {id: {primary:<yörünge anahtarı>, traj:[{traj,levels:[min,max]}]}}. 109 etkinlik · 20 yörünge omurgası (LT_MASTER_TR 17 Eyl 2026: composing 10 düzey).
export const ACT_TRAJ = {
 "a01": {
  "primary": "count",
  "traj": [
   {
    "traj": "count",
    "levels": [
     3,
     8
    ]
   },
   {
    "traj": "classif",
    "levels": [
     1,
     3
    ]
   }
  ]
 },
 "a02": {
  "primary": "pattern",
  "traj": [
   {
    "traj": "pattern",
    "levels": [
     2,
     4
    ]
   },
   {
    "traj": "classif",
    "levels": [
     2,
     4
    ]
   }
  ]
 },
 "a03": {
  "primary": "mlen",
  "traj": [
   {
    "traj": "mlen",
    "levels": [
     3,
     6
    ]
   },
   {
    "traj": "comp",
    "levels": [
     5,
     9
    ]
   }
  ]
 },
 "a04": {
  "primary": "add",
  "traj": [
   {
    "traj": "add",
    "levels": [
     4,
     8
    ]
   },
   {
    "traj": "comp",
    "levels": [
     14,
     18
    ]
   },
   {
    "traj": "count",
    "levels": [
     8,
     12
    ]
   }
  ]
 },
 "a05": {
  "primary": "frac",
  "traj": [
   {
    "traj": "frac",
    "levels": [
     2,
     5
    ]
   },
   {
    "traj": "multdiv",
    "levels": [
     2,
     4
    ]
   }
  ]
 },
 "a06": {
  "primary": "shape2d",
  "traj": [
   {
    "traj": "shape2d",
    "levels": [
     3,
     8
    ]
   },
   {
    "traj": "classif",
    "levels": [
     3,
     4
    ]
   }
  ]
 },
 "a07": {
  "primary": "add",
  "traj": [
   {
    "traj": "add",
    "levels": [
     10,
     12
    ]
   },
   {
    "traj": "multdiv",
    "levels": [
     6,
     8
    ]
   }
  ]
 },
 "a08": {
  "primary": "count",
  "traj": [
   {
    "traj": "count",
    "levels": [
     6,
     12
    ]
   },
   {
    "traj": "add",
    "levels": [
     4,
     7
    ]
   }
  ]
 },
 "a09": {
  "primary": "add",
  "traj": [
   {
    "traj": "add",
    "levels": [
     4,
     10
    ]
   },
   {
    "traj": "multdiv",
    "levels": [
     4,
     6
    ]
   },
   {
    "traj": "compose",
    "levels": [
     4,
     7
    ]
   }
  ]
 },
 "a10": {
  "primary": "classif",
  "traj": [
   {
    "traj": "classif",
    "levels": [
     6,
     11
    ]
   }
  ]
 },
 "a11": {
  "primary": "comp2d",
  "traj": [
   {
    "traj": "comp2d",
    "levels": [
     2,
     7
    ]
   },
   {
    "traj": "shape2d",
    "levels": [
     4,
     6
    ]
   }
  ]
 },
 "a12": {
  "primary": "multdiv",
  "traj": [
   {
    "traj": "multdiv",
    "levels": [
     2,
     5
    ]
   },
   {
    "traj": "frac",
    "levels": [
     2,
     4
    ]
   }
  ]
 },
 "a13": {
  "primary": "comp3d",
  "traj": [
   {
    "traj": "comp3d",
    "levels": [
     2,
     6
    ]
   },
   {
    "traj": "shape3d",
    "levels": [
     2,
     3
    ]
   }
  ]
 },
 "a14": {
  "primary": "count",
  "traj": [
   {
    "traj": "count",
    "levels": [
     3,
     6
    ]
   },
   {
    "traj": "mlen",
    "levels": [
     2,
     5
    ]
   },
   {
    "traj": "comp",
    "levels": [
     4,
     4
    ]
   }
  ]
 },
 "a15": {
  "primary": "count",
  "traj": [
   {
    "traj": "count",
    "levels": [
     11,
     14
    ]
   },
   {
    "traj": "pattern",
    "levels": [
     2,
     5
    ]
   }
  ]
 },
 "a16": {
  "primary": "sporient",
  "traj": [
   {
    "traj": "sporient",
    "levels": [
     4,
     7
    ]
   },
   {
    "traj": "mlen",
    "levels": [
     3,
     6
    ]
   }
  ]
 },
 "s01": {
  "primary": "comp3d",
  "traj": [
   {
    "traj": "comp3d",
    "levels": [
     2,
     7
    ]
   },
   {
    "traj": "spviz",
    "levels": [
     2,
     4
    ]
   }
  ]
 },
 "s02": {
  "primary": "sporient",
  "traj": [
   {
    "traj": "sporient",
    "levels": [
     6,
     8
    ]
   }
  ]
 },
 "s03": {
  "primary": "spviz",
  "traj": [
   {
    "traj": "spviz",
    "levels": [
     2,
     5
    ]
   },
   {
    "traj": "shape2d",
    "levels": [
     15,
     18
    ]
   }
  ]
 },
 "s04": {
  "primary": "sporient",
  "traj": [
   {
    "traj": "sporient",
    "levels": [
     3,
     5
    ]
   }
  ]
 },
 "s05": {
  "primary": "comp2d",
  "traj": [
   {
    "traj": "comp2d",
    "levels": [
     4,
     9
    ]
   },
   {
    "traj": "shape2d",
    "levels": [
     6,
     16
    ]
   }
  ]
 },
 "s06": {
  "primary": "spviz",
  "traj": [
   {
    "traj": "spviz",
    "levels": [
     5,
     7
    ]
   },
   {
    "traj": "sporient",
    "levels": [
     7,
     9
    ]
   }
  ]
 },
 "k01": {
  "primary": "frac",
  "traj": [
   {
    "traj": "frac",
    "levels": [
     5,
     9
    ]
   },
   {
    "traj": "multdiv",
    "levels": [
     6,
     9
    ]
   }
  ]
 },
 "k02": {
  "primary": "count",
  "traj": [
   {
    "traj": "count",
    "levels": [
     6,
     10
    ]
   },
   {
    "traj": "comp",
    "levels": [
     9,
     12
    ]
   }
  ]
 },
 "k03": {
  "primary": "mlen",
  "traj": [
   {
    "traj": "mlen",
    "levels": [
     2,
     6
    ]
   },
   {
    "traj": "mvol",
    "levels": [
     2,
     4
    ]
   }
  ]
 },
 "k04": {
  "primary": "count",
  "traj": [
   {
    "traj": "count",
    "levels": [
     3,
     8
    ]
   },
   {
    "traj": "sub",
    "levels": [
     3,
     6
    ]
   }
  ]
 },
 "k05": {
  "primary": "count",
  "traj": [
   {
    "traj": "count",
    "levels": [
     3,
     7
    ]
   },
   {
    "traj": "comp",
    "levels": [
     5,
     8
    ]
   }
  ]
 },
 "k06": {
  "primary": "frac",
  "traj": [
   {
    "traj": "frac",
    "levels": [
     2,
     4
    ]
   },
   {
    "traj": "multdiv",
    "levels": [
     1,
     3
    ]
   }
  ]
 },
 "k07": {
  "primary": "add",
  "traj": [
   {
    "traj": "add",
    "levels": [
     3,
     7
    ]
   },
   {
    "traj": "count",
    "levels": [
     6,
     10
    ]
   }
  ]
 },
 "k08": {
  "primary": "mvol",
  "traj": [
   {
    "traj": "mvol",
    "levels": [
     2,
     5
    ]
   }
  ]
 },
 "k09": {
  "primary": "shape2d",
  "traj": [
   {
    "traj": "shape2d",
    "levels": [
     3,
     8
    ]
   },
   {
    "traj": "classif",
    "levels": [
     2,
     4
    ]
   }
  ]
 },
 "k10": {
  "primary": "comp",
  "traj": [
   {
    "traj": "comp",
    "levels": [
     16,
     20
    ]
   }
  ]
 },
 "k11": {
  "primary": "frac",
  "traj": [
   {
    "traj": "frac",
    "levels": [
     2,
     5
    ]
   }
  ]
 },
 "k12": {
  "primary": "frac",
  "traj": [
   {
    "traj": "frac",
    "levels": [
     5,
     9
    ]
   }
  ]
 },
 "k13": {
  "primary": "multdiv",
  "traj": [
   {
    "traj": "multdiv",
    "levels": [
     3,
     7
    ]
   },
   {
    "traj": "frac",
    "levels": [
     3,
     5
    ]
   }
  ]
 },
 "k14": {
  "primary": "mvol",
  "traj": [
   {
    "traj": "mvol",
    "levels": [
     3,
     6
    ]
   },
   {
    "traj": "multdiv",
    "levels": [
     5,
     7
    ]
   }
  ]
 },
 "k15": {
  "primary": "classif",
  "traj": [
   {
    "traj": "classif",
    "levels": [
     7,
     9
    ]
   },
   {
    "traj": "comp",
    "levels": [
     18,
     22
    ]
   }
  ]
 },
 "m01": {
  "primary": "add",
  "traj": [
   {
    "traj": "add",
    "levels": [
     7,
     12
    ]
   },
   {
    "traj": "multdiv",
    "levels": [
     6,
     8
    ]
   }
  ]
 },
 "m02": {
  "primary": "multdiv",
  "traj": [
   {
    "traj": "multdiv",
    "levels": [
     6,
     9
    ]
   },
   {
    "traj": "comp",
    "levels": [
     18,
     22
    ]
   }
  ]
 },
 "m03": {
  "primary": "add",
  "traj": [
   {
    "traj": "add",
    "levels": [
     7,
     11
    ]
   },
   {
    "traj": "comp",
    "levels": [
     18,
     20
    ]
   }
  ]
 },
 "t01": {
  "primary": "add",
  "traj": [
   {
    "traj": "add",
    "levels": [
     7,
     10
    ]
   },
   {
    "traj": "count",
    "levels": [
     14,
     17
    ]
   }
  ]
 },
 "t02": {
  "primary": "add",
  "traj": [
   {
    "traj": "add",
    "levels": [
     4,
     7
    ]
   },
   {
    "traj": "count",
    "levels": [
     6,
     10
    ]
   }
  ]
 },
 "g01": {
  "primary": "add",
  "traj": [
   {
    "traj": "add",
    "levels": [
     4,
     11
    ]
   },
   {
    "traj": "classif",
    "levels": [
     6,
     11
    ]
   }
  ]
 },
 "g02": {
  "primary": "count",
  "traj": [
   {
    "traj": "count",
    "levels": [
     3,
     6
    ]
   },
   {
    "traj": "sub",
    "levels": [
     3,
     6
    ]
   }
  ]
 },
 "g03": {
  "primary": "sub",
  "traj": [
   {
    "traj": "sub",
    "levels": [
     4,
     7
    ]
   },
   {
    "traj": "count",
    "levels": [
     4,
     6
    ]
   }
  ]
 },
 "g04": {
  "primary": "add",
  "traj": [
   {
    "traj": "add",
    "levels": [
     4,
     7
    ]
   },
   {
    "traj": "compose",
    "levels": [
     4,
     6
    ]
   }
  ]
 },
 "g05": {
  "primary": "add",
  "traj": [
   {
    "traj": "add",
    "levels": [
     4,
     8
    ]
   },
   {
    "traj": "compose",
    "levels": [
     5,
     7
    ]
   }
  ]
 },
 "g06": {
  "primary": "comp",
  "traj": [
   {
    "traj": "comp",
    "levels": [
     15,
     19
    ]
   },
   {
    "traj": "count",
    "levels": [
     12,
     15
    ]
   }
  ]
 },
 "g07": {
  "primary": "add",
  "traj": [
   {
    "traj": "add",
    "levels": [
     7,
     11
    ]
   },
   {
    "traj": "compose",
    "levels": [
     6,
     7
    ]
   }
  ]
 },
 "g08": {
  "primary": "count",
  "traj": [
   {
    "traj": "count",
    "levels": [
     16,
     17
    ]
   },
   {
    "traj": "comp",
    "levels": [
     18,
     18
    ]
   }
  ]
 },
 "g09": {
  "primary": "count",
  "traj": [
   {
    "traj": "count",
    "levels": [
     14,
     15
    ]
   },
   {
    "traj": "frac",
    "levels": [
     3,
     4
    ]
   }
  ]
 },
 "g10": {
  "primary": "multdiv",
  "traj": [
   {
    "traj": "multdiv",
    "levels": [
     6,
     9
    ]
   },
   {
    "traj": "add",
    "levels": [
     10,
     12
    ]
   }
  ]
 },
 "f01": {
  "primary": "count",
  "traj": [
   {
    "traj": "count",
    "levels": [
     4,
     6
    ]
   },
   {
    "traj": "sub",
    "levels": [
     5,
     6
    ]
   }
  ]
 },
 "f02": {
  "primary": "add",
  "traj": [
   {
    "traj": "add",
    "levels": [
     4,
     7
    ]
   },
   {
    "traj": "compose",
    "levels": [
     4,
     6
    ]
   }
  ]
 },
 "f03": {
  "primary": "count",
  "traj": [
   {
    "traj": "count",
    "levels": [
     13,
     14
    ]
   },
   {
    "traj": "multdiv",
    "levels": [
     5,
     5
    ]
   }
  ]
 },
 "f04": {
  "primary": "count",
  "traj": [
   {
    "traj": "count",
    "levels": [
     1,
     4
    ]
   },
   {
    "traj": "sub",
    "levels": [
     4,
     6
    ]
   }
  ]
 },
 "f05": {
  "primary": "count",
  "traj": [
   {
    "traj": "count",
    "levels": [
     14,
     14
    ]
   },
   {
    "traj": "compose",
    "levels": [
     2,
     4
    ]
   }
  ]
 },
 "n01": {
  "primary": "classif",
  "traj": [
   {
    "traj": "classif",
    "levels": [
     6,
     9
    ]
   }
  ]
 },
 "n02": {
  "primary": "mlen",
  "traj": [
   {
    "traj": "mlen",
    "levels": [
     3,
     8
    ]
   },
   {
    "traj": "classif",
    "levels": [
     6,
     9
    ]
   }
  ]
 },
 "n03": {
  "primary": "classif",
  "traj": [
   {
    "traj": "classif",
    "levels": [
     3,
     9
    ]
   },
   {
    "traj": "count",
    "levels": [
     4,
     8
    ]
   }
  ]
 },
 "o01": {
  "primary": "frac",
  "traj": [
   {
    "traj": "frac",
    "levels": [
     5,
     7
    ]
   }
  ]
 },
 "o02": {
  "primary": "frac",
  "traj": [
   {
    "traj": "frac",
    "levels": [
     8,
     9
    ]
   }
  ]
 },
 "o03": {
  "primary": "comp",
  "traj": [
   {
    "traj": "comp",
    "levels": [
     18,
     21
    ]
   },
   {
    "traj": "count",
    "levels": [
     16,
     17
    ]
   }
  ]
 },
 "o04": {
  "primary": "count",
  "traj": [
   {
    "traj": "count",
    "levels": [
     16,
     17
    ]
   },
   {
    "traj": "compose",
    "levels": [
     7,
     10
    ]
   }
  ]
 },
 "o05": {
  "primary": "pattern",
  "traj": [
   {
    "traj": "pattern",
    "levels": [
     9,
     11
    ]
   }
  ]
 },
 "o06": {
  "primary": "count",
  "traj": [
   {
    "traj": "count",
    "levels": [
     14,
     14
    ]
   },
   {
    "traj": "compose",
    "levels": [
     2,
     4
    ]
   }
  ]
 },
 "o07": {
  "primary": "count",
  "traj": [
   {
    "traj": "count",
    "levels": [
     13,
     14
    ]
   },
   {
    "traj": "pattern",
    "levels": [
     7,
     8
    ]
   }
  ]
 },
 "o08": {
  "primary": "pattern",
  "traj": [
   {
    "traj": "pattern",
    "levels": [
     7,
     8
    ]
   }
  ]
 },
 "o09": {
  "primary": "comp",
  "traj": [
   {
    "traj": "comp",
    "levels": [
     20,
     22
    ]
   }
  ]
 },
 "o10": {
  "primary": "shape3d",
  "traj": [
   {
    "traj": "shape3d",
    "levels": [
     4,
     6
    ]
   }
  ]
 },
 "o11": {
  "primary": "marea",
  "traj": [
   {
    "traj": "marea",
    "levels": [
     5,
     7
    ]
   },
   {
    "traj": "mlen",
    "levels": [
     9,
     11
    ]
   }
  ]
 },
 "o12": {
  "primary": "mang",
  "traj": [
   {
    "traj": "mang",
    "levels": [
     5,
     5
    ]
   },
   {
    "traj": "shape2d",
    "levels": [
     10,
     13
    ]
   }
  ]
 },
 "o13": {
  "primary": "spviz",
  "traj": [
   {
    "traj": "spviz",
    "levels": [
     2,
     5
    ]
   }
  ]
 },
 "o14": {
  "primary": "classif",
  "traj": [
   {
    "traj": "classif",
    "levels": [
     6,
     7
    ]
   }
  ]
 },
 "o15": {
  "primary": "multdiv",
  "traj": [
   {
    "traj": "multdiv",
    "levels": [
     6,
     6
    ]
   }
  ]
 },
 "o16": {
  "primary": "mvol",
  "traj": [
   {
    "traj": "mvol",
    "levels": [
     3,
     4
    ]
   }
  ]
 },
 "o17": {
  "primary": "mlen",
  "traj": [
   {
    "traj": "mlen",
    "levels": [
     8,
     12
    ]
   }
  ]
 },
 "o18": {
  "primary": "sporient",
  "traj": [
   {
    "traj": "sporient",
    "levels": [
     8,
     9
    ]
   }
  ]
 },
 "o19": {
  "primary": "comp",
  "traj": [
   {
    "traj": "comp",
    "levels": [
     4,
     13
    ]
   }
  ]
 },
 "o20": {
  "primary": "classif",
  "traj": [
   {
    "traj": "classif",
    "levels": [
     3,
     4
    ]
   },
   {
    "traj": "shape2d",
    "levels": [
     2,
     5
    ]
   }
  ]
 },
 "p01": {
  "primary": "frac",
  "traj": [
   {
    "traj": "frac",
    "levels": [
     5,
     7
    ]
   },
   {
    "traj": "comp",
    "levels": [
     11,
     15
    ]
   }
  ]
 },
 "p02": {
  "primary": "multdiv",
  "traj": [
   {
    "traj": "multdiv",
    "levels": [
     4,
     8
    ]
   }
  ]
 },
 "p03": {
  "primary": "add",
  "traj": [
   {
    "traj": "add",
    "levels": [
     11,
     11
    ]
   },
   {
    "traj": "pattern",
    "levels": [
     8,
     9
    ]
   }
  ]
 },
 "p04": {
  "primary": "comp",
  "traj": [
   {
    "traj": "comp",
    "levels": [
     16,
     19
    ]
   },
   {
    "traj": "count",
    "levels": [
     12,
     14
    ]
   }
  ]
 },
 "p05": {
  "primary": "count",
  "traj": [
   {
    "traj": "count",
    "levels": [
     11,
     14
    ]
   },
   {
    "traj": "multdiv",
    "levels": [
     5,
     5
    ]
   }
  ]
 },
 "p06": {
  "primary": "comp",
  "traj": [
   {
    "traj": "comp",
    "levels": [
     16,
     19
    ]
   },
   {
    "traj": "count",
    "levels": [
     12,
     17
    ]
   }
  ]
 },
 "p07": {
  "primary": "pattern",
  "traj": [
   {
    "traj": "pattern",
    "levels": [
     9,
     10
    ]
   }
  ]
 },
 "p08": {
  "primary": "shape3d",
  "traj": [
   {
    "traj": "shape3d",
    "levels": [
     3,
     5
    ]
   }
  ]
 },
 "p09": {
  "primary": "marea",
  "traj": [
   {
    "traj": "marea",
    "levels": [
     5,
     7
    ]
   },
   {
    "traj": "mlen",
    "levels": [
     9,
     11
    ]
   }
  ]
 },
 "p10": {
  "primary": "spviz",
  "traj": [
   {
    "traj": "spviz",
    "levels": [
     4,
     5
    ]
   },
   {
    "traj": "shape2d",
    "levels": [
     15,
     18
    ]
   }
  ]
 },
 "p11": {
  "primary": "mang",
  "traj": [
   {
    "traj": "mang",
    "levels": [
     3,
     5
    ]
   },
   {
    "traj": "shape2d",
    "levels": [
     10,
     13
    ]
   }
  ]
 },
 "p12": {
  "primary": "classif",
  "traj": [
   {
    "traj": "classif",
    "levels": [
     6,
     9
    ]
   }
  ]
 },
 "p13": {
  "primary": "compose",
  "traj": [
   {
    "traj": "compose",
    "levels": [
     6,
     7
    ]
   },
   {
    "traj": "add",
    "levels": [
     5,
     7
    ]
   }
  ]
 },
 "p14": {
  "primary": "comp",
  "traj": [
   {
    "traj": "comp",
    "levels": [
     16,
     20
    ]
   },
   {
    "traj": "count",
    "levels": [
     12,
     15
    ]
   }
  ]
 },
 "p15": {
  "primary": "shape2d",
  "traj": [
   {
    "traj": "shape2d",
    "levels": [
     5,
     8
    ]
   }
  ]
 },
 "q01": {
  "primary": "comp",
  "traj": [
   {
    "traj": "comp",
    "levels": [
     4,
     13
    ]
   },
   {
    "traj": "count",
    "levels": [
     4,
     6
    ]
   }
  ]
 },
 "q02": {
  "primary": "pattern",
  "traj": [
   {
    "traj": "pattern",
    "levels": [
     5,
     8
    ]
   }
  ]
 },
 "q03": {
  "primary": "shape2d",
  "traj": [
   {
    "traj": "shape2d",
    "levels": [
     2,
     15
    ]
   },
   {
    "traj": "spviz",
    "levels": [
     2,
     5
    ]
   }
  ]
 },
 "q04": {
  "primary": "mlen",
  "traj": [
   {
    "traj": "mlen",
    "levels": [
     6,
     9
    ]
   }
  ]
 },
 "q05": {
  "primary": "count",
  "traj": [
   {
    "traj": "count",
    "levels": [
     14,
     14
    ]
   },
   {
    "traj": "compose",
    "levels": [
     6,
     7
    ]
   }
  ]
 },
 "q06": {
  "primary": "add",
  "traj": [
   {
    "traj": "add",
    "levels": [
     11,
     11
    ]
   },
   {
    "traj": "multdiv",
    "levels": [
     6,
     8
    ]
   }
  ]
 },
 "q07": {
  "primary": "add",
  "traj": [
   {
    "traj": "add",
    "levels": [
     11,
     12
    ]
   },
   {
    "traj": "compose",
    "levels": [
     9,
     10
    ]
   }
  ]
 },
 "q08": {
  "primary": "shape2d",
  "traj": [
   {
    "traj": "shape2d",
    "levels": [
     8,
     12
    ]
   }
  ]
 },
 "q09": {
  "primary": "frac",
  "traj": [
   {
    "traj": "frac",
    "levels": [
     6,
     7
    ]
   },
   {
    "traj": "multdiv",
    "levels": [
     7,
     7
    ]
   }
  ]
 },
 "q10": {
  "primary": "frac",
  "traj": [
   {
    "traj": "frac",
    "levels": [
     8,
     9
    ]
   }
  ]
 },
 "q11": {
  "primary": "mlen",
  "traj": [
   {
    "traj": "mlen",
    "levels": [
     9,
     12
    ]
   }
  ]
 },
 "q12": {
  "primary": "multdiv",
  "traj": [
   {
    "traj": "multdiv",
    "levels": [
     6,
     8
    ]
   },
   {
    "traj": "comp",
    "levels": [
     22,
     23
    ]
   }
  ]
 },
 "q13": {
  "primary": "mang",
  "traj": [
   {
    "traj": "mang",
    "levels": [
     5,
     6
    ]
   },
   {
    "traj": "shape2d",
    "levels": [
     13,
     17
    ]
   }
  ]
 },
 "q14": {
  "primary": "sporient",
  "traj": [
   {
    "traj": "sporient",
    "levels": [
     8,
     9
    ]
   },
   {
    "traj": "spviz",
    "levels": [
     5,
     6
    ]
   }
  ]
 }
};
