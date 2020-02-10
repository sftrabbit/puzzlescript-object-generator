const { PNG: PngParser } = require('pngjs')
const { promisify } = require('util')

PngParser.prototype.parse = promisify(PngParser.prototype.parse)

const BYTES_PER_PIXEL = 4

class Image {
  constructor (width = 0, height = 0) {
    this.width = width
    this.height = height
    this.data = Buffer.alloc(width * height * BYTES_PER_PIXEL)
  }

  static clone (image) {
    const clonedImage = new Image(image.width, image.height)
    clonedImage.data = Buffer.from(image.data)
    return clonedImage
  }

  static async fromPng (buffer) {
    const pngParser = new PngParser()
    const parseResult = await pngParser.parse(buffer)

    const image = new Image(parseResult.width, parseResult.height)
    image.data = Buffer.from(parseResult.data)
    return image
  }

  flip ({ horizontal }) {
    const flippedImage = new Image(this.width, this.height)

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const rowOffset = y * this.width
        this.data.copy(
          flippedImage.data,
          (rowOffset + (horizontal ? this.width - x - 1 : x)) * BYTES_PER_PIXEL,
          (rowOffset + x) * BYTES_PER_PIXEL,
          (rowOffset + x + 1) * BYTES_PER_PIXEL
        )
      }
    }

    return flippedImage
  }

  blend (sourceImage) {
    const blendedImage = Image.clone(this)

    if (sourceImage === null) {
      return blendedImage
    }

    for (let y = 0; y < sourceImage.height; y++) {
      for (let x = 0; x < sourceImage.width; x++) {
        const offset = (y * sourceImage.width + x) * BYTES_PER_PIXEL

        const sourceAlpha = sourceImage.data[offset + 3] / 0xff

        if (sourceAlpha === 0) {
          blendedImage.data[offset + 3] = 0
          continue
        }

        const destinationAlpha = this.data[offset + 3] / 0xff

        const resultAlpha = sourceAlpha + destinationAlpha * (1 - sourceAlpha)

        blendedImage.data[offset + 0] = (sourceImage.data[offset + 0] * sourceAlpha + this.data[offset + 0] * destinationAlpha * (1 - sourceAlpha)) / resultAlpha
        blendedImage.data[offset + 1] = (sourceImage.data[offset + 1] * sourceAlpha + this.data[offset + 1] * destinationAlpha * (1 - sourceAlpha)) / resultAlpha
        blendedImage.data[offset + 2] = (sourceImage.data[offset + 2] * sourceAlpha + this.data[offset + 2] * destinationAlpha * (1 - sourceAlpha)) / resultAlpha
        blendedImage.data[offset + 3] = resultAlpha * 0xff
      }
    }

    return blendedImage
  }
}

function unpackSpriteMap (spriteMap, { spriteWidth, spriteHeight }) {
  const sprites = []

  const spriteMapWidth = Math.floor(spriteMap.width / spriteWidth)
  const spriteMapHeight = Math.floor(spriteMap.height / spriteHeight)

  const spriteSize = spriteWidth * spriteHeight

  for (let y = 0; y < spriteMapHeight; y++) {
    sprites.push([])

    for (let x = 0; x < spriteMapWidth; x++) {
      const sprite = new Image(spriteWidth, spriteHeight)
      sprite.data = Buffer.alloc(spriteSize * BYTES_PER_PIXEL)
      sprites[y].push(sprite)

      const sourceOrigin = (x * spriteWidth) + (y * spriteHeight * spriteMap.width)

      for (let row = 0; row < spriteHeight; row++) {
        const targetRowStart = row * spriteWidth
        const sourceRowStart = sourceOrigin + row * spriteMap.width

        spriteMap.data.copy(
          sprites[y][x].data,
          targetRowStart * BYTES_PER_PIXEL,
          sourceRowStart * BYTES_PER_PIXEL,
          (sourceRowStart + spriteWidth) * BYTES_PER_PIXEL
        )
      }
    }
  }

  return sprites
}

module.exports = {
  Image,
  unpackSpriteMap,
  BYTES_PER_PIXEL
}
