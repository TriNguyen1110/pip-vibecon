// Per-student Pip helpers (CONTRACT: pip {creature, vibe, accessory, brain_version, form}).
export const pipOf = (x) => x?.pip ?? x?.student?.pip ?? null

export function pip2dProps(pip) {
  const v = Number(pip?.brain_version ?? pip?.stage) || 1
  return {
    creature: pip?.creature ?? 'capybara',
    vibe: pip?.vibe ?? 'plain',
    accessory: pip?.accessory ?? 'none',
    version: v,
    form: pip?.form === 'main' ? 'main' : 'base',
  }
}
