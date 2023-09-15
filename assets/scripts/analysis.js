class Vector {
    // https://radzion.com/blog/linear-algebra/vectors

    constructor(...components) {
        this.components = components
    }

    get dimensions() {
        this.components.length
    }

    scaleBy(number) {
        return new Vector(
        ...this.components.map(component => component * number)
        )
    }

    length() {
        return Math.hypot(...this.components)
    }

    normalized() {
        return this.scaleBy(1 / this.length())
    }

    static substract(v1, v2) {
        if (v1.dimensions != v2.dimensions) {
            throw new Error("Intentando restar vectores con diferentes dimensiones")
        }

        let components1 = v1.components
        let components2 = v2.components

        return new Vector(
            ...components1.map((component, index) => {
                return components2[index] - component
            })
        )
    }

    static add(v1, v2) {
        if (v1.dimensions != v2.dimensions) {
            throw new Error("Intentando sumar vectores con diferentes dimensiones")
        }

        let components1 = v1.components
        let components2 = v2.components

        return new Vector(
            ...components1.map((component, index) => components2[index] + component)
        )
    }

    static dotProduct(v1, v2) {
        let components1 = v1.components
        let components2 = v2.components
        return components2.reduce((acc, component, index) => acc + component * components1[index], 0)
    }
}

export class Hand {
    constructor(points) {
        this._points = points.map(pt => new Vector(pt.x, pt.y, pt.z))

        this.constructFingers()
    }

    static thresholds = { // TEMPORAL
        'index': 1.5,
        'middle': 1.5,
        'ring': 1.5,
        'pinky': 1.5,
        'thumb': 1.6
    }

    pointsToVectors(points) {
        let vectors = []
        for(let i = 1; i < points.length; i++) {
            let index1 = points[i-1]
            let index2 = points[i]

            let point1 = this._points[index1]
            let point2 = this._points[index2]

            const vec = Vector.substract(point2, point1)
            vectors.push(vec.normalized())
        }

        return vectors
    }

    isFingerCurled(finger) {
        let fingerVectors = this.fingers[finger]
        if (fingerVectors === undefined) {
            throw new Error('Dedo no encontrado')
        }

        let dotAccumulation = 0

        for (let i = 1; i < fingerVectors.length; i++) {
            let vec1 = fingerVectors[i-1]
            let vec2 = fingerVectors[i]

            let dot = Math.abs(Vector.dotProduct(vec1, vec2))
            
            dotAccumulation += dot
        }

        return dotAccumulation < Hand.thresholds[finger]
    }

    constructFingers() {
        // Calcular y guardar los vectores aquí
        const fingers = {}
        let indexPoints = [5, 6, 7, 8]
        fingers.index = this.pointsToVectors(indexPoints)

        let middlePoints = [9, 10, 11, 12]
        fingers.middle = this.pointsToVectors(middlePoints)

        let ringPoints = [13, 14, 15, 16]
        fingers.ring = this.pointsToVectors(ringPoints)
        
        let pinkyPoints = [17, 18, 19, 20]
        fingers.pinky = this.pointsToVectors(pinkyPoints)

        let thumbPoints = [1, 2, 3, 4]
        fingers.thumb = this.pointsToVectors(thumbPoints)

        this.fingers = fingers
    }

}

const resultsDiv = document.getElementById('results')

export async function analyze(hand) {
    resultsDiv.innerHTML = `
    <h1>Results</h1>
    <ul>
        <li>${hand.isFingerCurled('index')}</li>
        <li>${hand.isFingerCurled('middle')}</li>
        <li>${hand.isFingerCurled('ring')}</li>
        <li>${hand.isFingerCurled('pinky')}</li>
        <li>${hand.isFingerCurled('thumb')}</li>
    </ul>
    `
}