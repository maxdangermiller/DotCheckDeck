export class APISetWithDots {
	/**
	 * This is to store the data from the /get-dots API call
	 * @param {string} counts Number of counts
	 * @param {array} dots Dots Array of DotCordData class
	 * @param {int} index This is the index in the array of these
	 * @param {int} setID 
	 * @param {string} setName 
	 * @param {string} setNumb 
	 */
	constructor(counts, dots, index, setID, setName, setNumb) {
		this.counts = counts;
		this.dots = dots;
		this.index = index;
		this.setID = setID;
		this.setName = setName;
		this.setNumb = setNumb;
	}

    static createFromJson(json) {
        let tempArray = [];
        for (let i = 0; i < json.dots.length; i++) {
            tempArray.push(DotCordData.createFromJson(json.dots[i]));
            
        }

        return new APISetWithDots(
            json.counts, tempArray, json.index, json.setID, json.setName, json.setNumb
        );
    }    
}

export class DotCordData {
	/**
	 * 
	 * @param {int} x 
	 * @param {int} y 
	 * @param {DotData} dot
	 * @param {int} counts 
	 * @param {int} r 
	 * @param {int} g 
	 * @param {int} b 
	 * @param {string} userLabel 
	 * @param {string} userName 
	 */
	constructor(x, y, dot, counts, r, g, b, userLabel, userName) {
		this.x = x;
		this.y = y;
		this.dot = dot;
		this.counts = counts;
		this.r = r;
		this.g = g;
		this.b = b;
		this.userLabel = userLabel;
		this.userName = userName;
	}

    static createFromJson(json) {
        return new DotCordData(
            json.x, json.y, DotData.createFromJson(json.dot), json.r, json.g, json.b, json.userLabel, json.userName
        );
    }
}

export class DotData {
	/**
	 * 
	 * @param {int} id 
	 * @param {int} setID 
	 * @param {int} userID 
	 * @param {int} schoolID 
	 * @param {string} direction 
	 * @param {string} line 
	 * @param {float} steps 
	 * @param {int} side 
	 * @param {float} fbSteps 
	 * @param {string} fbDirection 
	 * @param {string} useHash 
	 */
	constructor(
		id, setID, userID, schoolID, direction, 
		line, steps, side, fbSteps, fbDirection, useHash
	) {
		this.id = id;
		this.setID = setID;
		this.userID = userID;
		this.schoolID = schoolID;
		this.direction = direction;
		this.line = line;
		this.steps = steps;
		this.side = side;
		this.fbSteps = fbSteps;
		this.fbDirection = fbDirection;
		this.useHash = useHash;
	}

    static createFromJson(json) {
        return new DotData(
            json.id, json.setID, json.userID, json.schoolID, json.direction, json.line, json.steps, json.side,
            json.fbSteps, json.fbDirection, json.useHash
        );
    }
}