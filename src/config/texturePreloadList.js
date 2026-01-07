/**
 * Texture Preload List - All textures for entrance and corridor scenes
 * These are preloaded during the initial loading phase for faster perceived load time.
 * Room textures are NOT included - they load on-demand when user clicks a door.
 */

// Entrance scene textures
export const ENTRANCE_TEXTURES = [
    // Doors
    '/textures/doors/frame_sketch.webp',
    '/textures/doors/door_left_sketch.webp',
    '/textures/doors/door_right_sketch.webp',
    '/textures/doors/handle_left_sketch.webp',
    '/textures/doors/handle_right_sketch.webp',
    '/textures/doors/door_back_left_sketch.webp',
    '/textures/doors/pien.webp',
    // Environment
    '/textures/entrance/wall_bricks_2.webp',
    '/textures/entrance/stone-path.webp',
    '/textures/entrance/floor_paper.webp',
    '/textures/entrance/belka.webp',
    '/textures/entrance/sign.webp',
    // Characters/Objects
    '/textures/entrance/cat_front_body.webp',
    '/textures/entrance/window_sketch.webp',
    '/textures/entrance/avatar_window.webp',
    '/textures/entrance/tree_sketch.webp',
    '/textures/entrance/mouse_hanging.webp',
    '/textures/entrance/pot_with_duck.webp',
    '/textures/entrance/bug_sketch.webp',
    '/textures/entrance/speech_bubble.webp',
    // Images
    '/images/avatar-happy.webp',
    '/images/ink-splash.webp',
];

// Corridor scene textures
export const CORRIDOR_TEXTURES = [
    // Walls/Floor/Ceiling
    '/textures/corridor/wall_texture.webp',
    '/textures/corridor/floor_wood.webp',
    '/textures/corridor/ceiling_texture.webp',
    '/textures/paper-texture.webp',
    '/textures/corridor/avatar_sketch.webp',
    // Double doors (end of corridor)
    '/textures/corridor/doors/frame_sketch.webp',
    '/textures/corridor/doors/doorrleft.webp',
    '/textures/corridor/doors/dorright.webp',
    '/textures/corridor/doors/handle_left_sketch.webp',
    '/textures/corridor/doors/handle_right_sketch.webp',
    '/textures/corridor/doors/pien.webp',
    // Single side doors
    '/textures/corridor/doors/ramkasingledoors.webp',
    '/textures/corridor/doors/klamkadodrzwi.webp',
    '/textures/corridor/doors/backsingledoors.webp',
    '/textures/corridor/doors/drzwiprojekty.webp',
    '/textures/corridor/doors/drzwisocial.webp',
    '/textures/corridor/doors/drzwiabout.webp',
    '/textures/corridor/doors/drzwikontakt.webp',
    // Signs
    '/textures/corridor/thegallerysign.webp',
    '/textures/corridor/thestudiosign.webp',
    '/textures/corridor/aboutsign.webp',
    '/textures/corridor/contactsign.webp',
    // Decorations
    '/textures/corridor/decorations/while_true_loop.webp',
    '/textures/corridor/decorations/coffee_debug.webp',
    '/textures/corridor/decorations/idea_process.webp',
    '/textures/corridor/decorations/paper_ball.webp',
    '/textures/corridor/decorations/paper_airplane.webp',
    '/textures/corridor/decorations/pencil.webp',
    '/textures/corridor/decorations/coffee_cup.webp',
];

// Additional textures from App.jsx
export const UI_TEXTURES = [
    '/images/avatar-thinking.webp',
    '/images/avatar-hero.webp',
];

// Combined list for preloading
export const PRELOAD_ALL = [
    ...ENTRANCE_TEXTURES,
    ...CORRIDOR_TEXTURES,
    ...UI_TEXTURES,
];
