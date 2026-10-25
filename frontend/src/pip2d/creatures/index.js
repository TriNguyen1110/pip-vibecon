import capybara from './capybara'
import corgi from './corgi'
import cat from './cat'
import raccoon from './raccoon'
import frog from './frog'
import axolotl from './axolotl'
import blob from './blob'
import { capybaraViews, frogViews, catViews, raccoonViews, axolotlViews } from './views'

// Roster order: capybara is the default Pip.
export const CREATURES_2D = ['capybara', 'corgi', 'cat', 'raccoon', 'frog', 'axolotl']
// dedicated turnaround art (side + back) for the rest of the roster
capybara.views = capybaraViews
frog.views = frogViews
cat.views = catViews
raccoon.views = raccoonViews
axolotl.views = axolotlViews

export const CREATURE_DEFS = { capybara, corgi, cat, raccoon, frog, axolotl, blob }
