# PuzzleScript Object Generator

This is very much work-in-progress, but it can be used to generate PuzzleScript objects from a sprite map PNG file.

## Usage

It's a Node.js script, so you'll need a Node runtime, which I recommend installing with [NVM](https://github.com/nvm-sh/nvm). The latest version of Node will probably do. Then install dependencies:

```bash
npm install
```

Then you just need two files (right now the script doesn't let you specify whatever filenames you want - these exact files have to be in your current working directory):

- `spriteMap.png` - this is your sprite map and contains 5x5 pixel sprites packed together (no padding between sprites).
- `objects.yaml` - this is where you provide all the configuration for *how* your objects will be generated.

Once you have those files in place, you can run the script with:

```bash
node index.js
```

## Writing `objects.yaml`

The most basic entry in `objects.yaml` would look like this:

```yaml
Player:
  position: { x: 1, y: 3 }
```

This will generate an object called `Player` by taking the sprite at position (1, 3) in the sprite map. Positions are 0-indexed, where `x` is along the horizontal axis and `y` along the vertical axis, starting at the top-left corner.

However, we can also do more complex object generation. Each top-level key in your YAML file may actually generate more than one object. For example, you can horizontally flip a sprite (I didn't add vertical flipping yet!):

```yaml
Player:
  position: { x: 1, y: 3 }
  flip: True
```

This will generate two objects, `Player_R` and `Player_L`.

If you have a bunch of sprites horizontally adjacent in the sprite map that you'd like to just name the same way but with a number indexing them, you can do:

```yaml
Background:
  position: { x: 0, y: 0 }
  sequence: 4
```

This will generate four objects: `Background_0` through to `Background_3`, taken from positions (0, 0) through to (0, 3).

Another very powerful thing you can do is blend sprites together. And better yet, blending supports transparency! Lets say you want to cast a shadow on your player, so in your sprite map you have both your player sprite and a shadow sprite, you can do:

```yaml
Player:
  position: { x: 0, y: 0 }
  blend: [Null, Shadow]
Shadow:
  position: { x: 1, y: 0 }
```

This will create two blends of `Player`. The first blend is with `Null` which means "don't blend with anything". The second blend is with the `Shadow` object defined in the same file. Let's say you actually want to flip the `Shadow` and blend it in both orientations, you can do that simply with:

```yaml
Player:
  position: { x: 0, y: 0 }
  blend: [Null, Shadow]
Shadow:
  position: { x: 1, y: 0 }
  flip: True
```

Basically all of the above options combine however you like and blending with an object definition that produces multiple objects will do multiple blends! If you also wanted to flip the `Player` too, you can do that!

The very last option that's supported for now is `omit`, which is useful if you have a sprite that you want to use only for blending, but you don't actually want to generate an object for it. It's worth noting that sprites that are made entirely of semi-transparent pixels will be omitted anyway.
