module.exports = class Utils {

    static distinct(data)
    {
        const distinctData = [];
        const map = new Map();

        for (const item of data) {
            if (!map.has(item.name)) {
                map.set(item.name, true);
                distinctData.push(item);
            }
        }

        return distinctData;
    }
}