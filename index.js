const fs = require('fs').promises
const { safeLoad: parseYaml } = require('js-yaml')

const { Image, unpackSpriteMap } = require('./image')
const { PuzzleScriptObject } = require('./puzzleScriptObject')

async function printObjects () {
  const spriteMap = await Image.fromPng(await fs.readFile('./spriteMap.png'))
  const sprites = unpackSpriteMap(spriteMap, { spriteWidth: 5, spriteHeight: 5 })

  const objectDefinitions = parseYaml(await fs.readFile('./objects.yaml'))

  for (const objectId in objectDefinitions) {
    const variants = getObjectVariants(objectId, objectDefinitions, sprites)

    for (const variant of variants) {
      const object = new PuzzleScriptObject(variant.name, variant.sprite)

      if (objectDefinitions[objectId].omit || object.isBlank()) {
        continue
      }

      process.stdout.write(object.format())
    }
  }
}

function getObjectVariants (id, objectDefinitions, sprites) {
  const objectDefinition = objectDefinitions[id]
  const variantModifierSets = getVariantModifierSets(id, objectDefinitions, sprites)

  return cartesianProduct(variantModifierSets)
    .map((variantModifiers) => {
      const variantOptions= {
        sourcePosition: {
          x: objectDefinition.position.x,
          y: objectDefinition.position.y
        },
        suffixes: [],
        flip: { horizontal: false },
        blendSprite: null
      }

      variantModifiers.forEach((variantModifier) => variantModifier(variantOptions))

      const { sourcePosition } = variantOptions

      const sprite = sprites[sourcePosition.y][sourcePosition.x]
        .flip(variantOptions.flip)
        .blend(variantOptions.blendSprite)

      return {
        name: [id, ...variantOptions.suffixes].join('_'),
        sprite
      }
    })
}

function getVariantModifierSets (id, objectDefinitions, sprites) {
  const objectDefinition = objectDefinitions[id]

  const variantModifierSets = []

  if (objectDefinition.flip) {
    variantModifierSets.push([
      (variantOptions) => {
        variantOptions.suffixes.push('R')
        variantOptions.flip.horizontal = false
      },
      (variantOptions) => {
        variantOptions.suffixes.push('L')
        variantOptions.flip.horizontal = true
      }
    ])
  }

  if (objectDefinition.sequence) {
    variantModifierSets.push(
      [...new Array(objectDefinition.sequence).keys()]
        .map((index) => {
          return (variantOptions) => {
            variantOptions.sourcePosition.x += index
            variantOptions.suffixes.push(`${index}`)
          }
        })
    )
  }

  if (objectDefinition.blend) {
    variantModifierSets.push(objectDefinition.blend
      .reduce((variantModifiers, blendId) => {
        if (blendId === null) {
          variantModifiers.push((variantOptions) => variantOptions)
          return variantModifiers
        }

        const blendVariants = getObjectVariants(blendId, objectDefinitions, sprites)

        for (const blendVariant of blendVariants) {
          variantModifiers.push((variantOptions) => {
            variantOptions.blendSprite = blendVariant.sprite
            variantOptions.suffixes.push(blendVariant.name)
          })
        }

        return variantModifiers
      }, [])
    )
  }

  return variantModifierSets
}

function cartesianProduct (sets) {
  const indexedResults = []
  const queue = [[]]

  while (queue.length > 0) {
    const prefix = queue.shift()

    const setIndex = prefix.length

    if (setIndex >= sets.length) {
      indexedResults.push(prefix)
      continue
    }

    for (const element of sets[setIndex]) {
      queue.push([...prefix, element])
    }
  }

  return indexedResults
}

printObjects()
  .catch((error) => setImmediate(() => { throw error }))
