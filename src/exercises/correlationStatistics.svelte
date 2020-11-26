<!--
NOTE: One can expand more about this subject
NOTE: Text from Eloqvent JS : Lycantrophe Journal
* Correlation is a measure of dependence between statistical variables
* Correlation between variables is usually expressed as 
  a value that ranges from -1 to 1
* To compute the measure of correlation between two Boolean variables, 
  we can use the phi coefficient (φ)
*

Puttin some data in frequency table

No squirrel : no pizza 76  -  No squirrel : pizza 9
Squirrel : no pizza 4  -  Squirrel : pizza 1
-->


<script>
// Function that computes the phi coefficient from such an array: 
// Direct translation of the phi formula into JS
function phi(table) {
  return (table[3] * table[0] - table[2] * table[1]) /
    Math.sqrt((table[2] + table[3]) * 
              (table[0] + table[1]) * 
              (table[1] + table[3]) * 
              (table[0] + table[2]));
}
console.log(phi([76, 9, 4, 1]));  // → 0.068599434

// Extracting a two by two table from events
function tableFor(event, journal) {
  let table = [0, 0, 0, 0];
  for (let i = 0; i < journal.length; i++) {
    let entry = journal[i];
    let index = 0;

    if (entry.events.includes(event)) {
      index += 1;
    }

    if (entry.squirl) {
      index += 2;
    }
    table[index] += 1;
  }
  return table;
}

console.log(tableFor("pizza", JOURNAL)); // → [76, 9, 4, 1]

// Extrating the events from the Journal
function journalEvents(journal) {
  let events = [];
  for (let entry of journal) {
    for (let event of entry.events ) {
      if(!events.includes(event)) {
        events.push(event);
      }
    }
  }
  return events;
}

console.log(journalEvents(JOURNAL)); // → ["carrot", "exercise", "weekend", "bread", ...]

</script>


<p>
  Correlation Statistics
</p>

