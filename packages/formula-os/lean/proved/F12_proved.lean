
-- PURIQ F12 (Mathlib-free): CRT collision period for coprime 7,12 is 84.
namespace PuriqF12
def crtPeriod (a b : Nat) : Nat := Nat.lcm a b
theorem crt_7_12 : crtPeriod 7 12 = 84 := by
  rfl
end PuriqF12
