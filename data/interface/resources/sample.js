const arr = [];
const numbers = [1, 2, 3, 4, 5];

const test = function () {
  for (let r = 0; r < numbers.length; r++) {
    arr.push(10 * numbers[r]);
  }
  //
  console.log("Result", arr);
};

window.setTimeout(test, 1000);