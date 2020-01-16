class MathUtils {
    /**
    * @param {number} minInclusive
    * @param {number} maxInclusive
    * @returns {number}
    */
    static randomInt(minInclusive, maxInclusive) {
        minInclusive = Math.ceil(minInclusive);
        maxInclusive = Math.floor(maxInclusive);
        return Math.floor(Math.random() * (maxInclusive - minInclusive + 1)) + minInclusive;
    }

    static dist(x1, y1, x2, y2) {
        return Math.sqrt(((x1 - x2) ** 2) + ((y1 - y2) ** 2));
    }

    static isInCircle(checkX, checkY, circleX, circleY, radius) {
        return Math.sqrt(((circleX - checkX) ** 2) + ((circleY - checkY) ** 2)) <= radius;
    }
}