/*
  One worked solution for each exercise in exercises.html, keyed by id.

  They live here rather than in the page so that students cannot read the
  answers with View Source. Only the tests use them: test-exercises.js
  runs every one against its exercise's tests. The deploy publishes *.html
  only, so this file never goes online.

  (c) 2026 Jose Galan. All rights reserved.
*/
module.exports = {
  vars1: 'print("Hello world")\n',
  vars2: 'name = "Ada"\nprint(name)\n',
  vars3: 'name = "Ada"\nage = 15\nprint(name, "is", age)\n',
  vars4: 'score = 10\nscore = score + 5\nprint(score)\n',
  vars5: 'a = 3\nb = 8\ntemp = a\na = b\nb = temp\nprint(a)\nprint(b)\n',
  inp1: 'name = input("What is your name? ")\nprint("Hello", name)\n',
  inp2: 'age = int(input("How old are you? "))\nprint("Next year you will be", age + 1)\n',
  inp3: 'first = int(input("First number: "))\nsecond = int(input("Second number: "))\nprint("Total:", first + second)\n',
  inp4: 'price = float(input("Price of one item: "))\nprint("Three cost", price * 3)\n',
  inp5: 'name = input("Name: ")\nage = int(input("Age: "))\nprint(name, "will be", age + 1, "next year")\n',
  ops1: 'width = int(input("Width: "))\nheight = int(input("Height: "))\nprint("Area:", width * height)\n',
  ops2: 'total = int(input("Seconds: "))\nprint(total // 60)\nprint(total % 60)\n',
  ops3: 'a = int(input("First: "))\nb = int(input("Second: "))\nc = int(input("Third: "))\nmean = (a + b + c) / 3\nprint("Mean:", round(mean, 1))\n',
  ops4: 'score = int(input("Score: "))\ntotal = int(input("Out of: "))\nprint("Percentage:", score / total * 100)\n',
  ops5: 'pence = int(input("Amount in pence: "))\nprint(pence // 100)\nprint(pence % 100)\n',
  sel1: 'mark = int(input("Mark: "))\nif mark >= 40:\n    print("Pass")\nelse:\n    print("Fail")\n',
  sel2: 'number = int(input("Whole number: "))\nif number % 2 == 0:\n    print("Even")\nelse:\n    print("Odd")\n',
  sel3: 'mark = int(input("Mark out of 100: "))\nif mark >= 80:\n    print("Distinction")\nelif mark >= 60:\n    print("Merit")\nelif mark >= 40:\n    print("Pass")\nelse:\n    print("Ungraded")\n',
  sel4: 'user = input("Username: ")\npassword = input("Password: ")\nif user == "admin" and password == "letmein":\n    print("Welcome")\nelse:\n    print("Access denied")\n',
  sel5: 'a = int(input("First: "))\nb = int(input("Second: "))\nc = int(input("Third: "))\nbiggest = a\nif b > biggest:\n    biggest = b\nif c > biggest:\n    biggest = c\nprint("Biggest:", biggest)\n',
  for1: 'for i in range(1, 6):\n    print(i)\n',
  for2: 'table = int(input("Which times table? "))\nfor i in range(1, 13):\n    print(table, "x", i, "=", table * i)\n',
  for3: 'for i in range(5, 0, -1):\n    print(i)\nprint("Lift off!")\n',
  for4: 'total = 0\nfor count in range(5):\n    number = int(input("Enter a number: "))\n    total = total + number\nprint("Total:", total)\n',
  for5: 'highest = int(input("Enter a number: "))\nfor count in range(4):\n    number = int(input("Enter a number: "))\n    if number > highest:\n        highest = number\nprint("Highest:", highest)\n',
  whi1: 'password = input("Password: ")\nwhile password != "letmein":\n    print("Wrong password")\n    password = input("Password: ")\nprint("Access granted")\n',
  whi2: 'total = 0\nnumber = int(input("Number (0 to stop): "))\nwhile number != 0:\n    total = total + number\n    number = int(input("Number (0 to stop): "))\nprint("Total:", total)\n',
  whi3: 'number = int(input("A number between 1 and 10: "))\nwhile number < 1 or number > 10:\n    print("That is not between 1 and 10")\n    number = int(input("A number between 1 and 10: "))\nprint("Thank you:", number)\n',
  whi4: 'number = int(input("Whole number: "))\ncount = 0\nwhile number > 1:\n    number = number // 2\n    count = count + 1\nprint("Halvings:", count)\n',
  whi5: 'total = 0\ncount = 0\nmark = int(input("Mark (-1 to stop): "))\nwhile mark != -1:\n    total = total + mark\n    count = count + 1\n    mark = int(input("Mark (-1 to stop): "))\nprint(count)\nif count > 0:\n    print(total / count)\nelse:\n    print("No marks were entered")\n',
  str1: 'word = input("A word: ")\nprint("Characters:", len(word))\n',
  str2: 'word = input("A word: ")\nprint(word.upper())\nprint(word[0])\n',
  str3: 'full = input("Full name: ")\nparts = full.split(" ")\nprint(parts[0][0] + "." + parts[1][0] + ".")\n',
  str4: 'word = input("A word: ")\nprint(word[:3])\nprint(word[-3:])\n',
  str5: 'word = input("A word: ")\ncount = 0\nfor letter in word:\n    if letter in "aeiou":\n        count = count + 1\nprint("Vowels:", count)\n',
  arr1: 'colours = ["red", "green", "blue"]\nfor colour in colours:\n    print(colour)\n',
  arr2: 'items = []\nfor count in range(3):\n    item = input("Item: ")\n    items.append(item)\nprint(len(items))\nfor item in items:\n    print(item)\n',
  arr3: 'fruits = ["apple", "pear", "cherry"]\nfruits[1] = "banana"\nfor fruit in fruits:\n    print(fruit)\n',
  arr4: 'names = ["Ana", "Ben", "Caz", "Dev"]\ntarget = input("Who are you looking for? ")\nfound = False\nfor i in range(len(names)):\n    if names[i] == target:\n        found = True\n        print("Found at index", i)\nif not found:\n    print("Not in the list")\n',
  arr5: 'seats = [["-", "X", "-"],\n         ["X", "X", "-"],\n         ["-", "X", "X"]]\nfree = 0\nfor row in range(3):\n    for seat in range(3):\n        if seats[row][seat] == "-":\n            free = free + 1\nprint("Free seats:", free)\n',
  sub1: 'def greet():\n    print("Hello")\n\ngreet()\ngreet()\ngreet()\n',
  sub2: 'def greet(name):\n    print("Hello", name)\n\ngreet("Sam")\ngreet("Ada")\n',
  sub3: 'def area(width, height):\n    return width * height\n\nprint(area(5, 3))\nprint(area(10, 2))\n',
  sub4: 'def isEven(number):\n    return number % 2 == 0\n\nprint(isEven(4))\nprint(isEven(7))\n',
  sub5: 'def highest(a, b, c):\n    biggest = a\n    if b > biggest:\n        biggest = b\n    if c > biggest:\n        biggest = c\n    return biggest\n\nfirst = int(input("First: "))\nsecond = int(input("Second: "))\nthird = int(input("Third: "))\nprint("Biggest:", highest(first, second, third))\n',
  fil1: 'myFile = open("scores.txt", "r")\nprint(myFile.read())\nmyFile.close()\n',
  fil2: 'myFile = open("scores.txt", "r")\nprint(myFile.readline())\nmyFile.close()\n',
  fil3: 'myFile = open("greeting.txt", "w")\nmyFile.write("Hello")\nmyFile.close()\n',
  fil4: 'name = input("Name to add: ")\nmyFile = open("names.txt", "a")\nmyFile.write(name + "\\n")\nmyFile.close()\n',
  fil5: 'myFile = open("scores.txt", "r")\nhighest = 0\nline = myFile.readline()\nwhile line != "":\n    parts = line.split(" ")\n    score = int(parts[1])\n    if score > highest:\n        highest = score\n    line = myFile.readline()\nmyFile.close()\nprint("Top score:", highest)\n'
};
