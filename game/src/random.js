// A small seeded random source (mulberry32) so a screenshot seed always deals
// the same hands. The live game seeds it from the clock; ?seed=N fixes it.

export function createRandom(seed) {
  let state = seed >>> 0;
  function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }
  function integer(bound) {
    return Math.floor(next() * bound);
  }
  function pick(list) {
    return list[integer(list.length)];
  }
  /** Fisher-Yates shuffle, in place, driven by this source. */
  function shuffle(list) {
    for (let index = list.length - 1; index > 0; index -= 1) {
      const other = integer(index + 1);
      const held = list[index];
      list[index] = list[other];
      list[other] = held;
    }
    return list;
  }
  return { next, integer, pick, shuffle };
}
