
-- PURIQ F18 (Mathlib-free): #programs of length <= 10 is 2^11 - 1 = 2047.
namespace PuriqF18
def numProgramsUpTo (k : Nat) : Nat := 2^(k+1) - 1
theorem programs_k10 : numProgramsUpTo 10 = 2047 := by
  rfl
end PuriqF18
