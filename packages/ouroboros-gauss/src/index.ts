/**
 * @workspace/ouroboros-gauss — the Gauß-mathematics axis of Ouroboros.
 *
 * Four primitives, all sourced from the Carl Friedrich Gauß Nachlass
 * at the Niedersächsische Staats- und Universitätsbibliothek Göttingen
 * (Cod. Ms. Gauß), Kalliope finding-aid DE-611-BF-61709.
 *
 *  - Least-squares network adjustment       (Theoria combinationis 1823;
 *                                             Hannoversche Landesvermessung
 *                                             Cod. Ms. Gauß "Geodäsie 165–170")
 *  - Conformal projection check             (Cod. Ms. Gauß "Geodäsie 179–184";
 *                                             1825 prize essay)
 *  - Form class number                      (Cod. Ms. Gauß "Mathematik 07–10";
 *                                             Disq. Arith. §223–§307)
 *  - Gaussian residual goodness-of-fit       (Cod. Ms. Gauß "Mathematik 35–47";
 *                                             Theoria motus 1809)
 */

export * from "./least-squares.js";
export * from "./conformal.js";
export * from "./class-number.js";
export * from "./residual-fit.js";
