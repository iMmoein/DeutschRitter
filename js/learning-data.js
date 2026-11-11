window.LEARNING_UNITS = {
  "act1": {
    "goal": "Sich vorstellen und nach einem Ort fragen",
    "writing": "Du bist neu im Sprachkurs. Stelle dich vor und frage nach dem Kursraum.",
    "speaking": "Stelle dich ohne Vorlage vor. Beantworte danach: Wo wohnst du? Welche Sprachen sprichst du?",
    "exercises": [
      {
        "prompt": "Ich ___ Sara.",
        "answers": [
          "heiße"
        ],
        "explanation": "heißen: ich heiße, du heißt.",
        "model": "Ich heiße Sara.",
        "kind": "gap"
      },
      {
        "prompt": "Ordne: wohne / in Berlin / Ich",
        "answers": [
          "Ich wohne in Berlin",
          "In Berlin wohne ich"
        ],
        "explanation": "Das finite Verb steht an Position zwei.",
        "model": "Ich wohne in Berlin.",
        "kind": "order"
      },
      {
        "prompt": "Korrigiere: Ich kommen aus Finnland.",
        "answers": [
          "Ich komme aus Finnland"
        ],
        "explanation": "Bei ich endet kommen auf -e.",
        "model": "Ich komme aus Finnland.",
        "kind": "correction"
      }
    ],
    "listening": {
      "text": "Der Deutschkurs beginnt um neun Uhr. Wir treffen uns in Raum zwölf. Bitte kommen Sie zehn Minuten früher.",
      "question": "In welchem Raum findet der Kurs statt?",
      "options": [
        "Raum 9",
        "Raum 12",
        "Raum 10"
      ],
      "answer": 1,
      "explanation": "Wir treffen uns in Raum zwölf."
    }
  },
  "act2": {
    "goal": "Im Café bestellen und Preise verstehen",
    "writing": "Bestelle ein Getränk und etwas zu essen. Frage nach dem Preis und bitte um die Rechnung.",
    "speaking": "Bestelle ohne Vorlage. Das gewünschte Getränk ist ausverkauft: Frage nach einer Alternative.",
    "exercises": [
      {
        "prompt": "Ich möchte ___ Kaffee.",
        "answers": [
          "einen"
        ],
        "explanation": "Kaffee ist maskulin; nach möchte steht hier Akkusativ.",
        "model": "Ich möchte einen Kaffee.",
        "kind": "gap"
      },
      {
        "prompt": "Ordne: bitte / Die Rechnung",
        "answers": [
          "Die Rechnung bitte"
        ],
        "explanation": "Eine höfliche kurze Bitte: Die Rechnung, bitte!",
        "model": "Die Rechnung, bitte!",
        "kind": "order"
      },
      {
        "prompt": "Korrigiere: Ich nehme ein Tee.",
        "answers": [
          "Ich nehme einen Tee"
        ],
        "explanation": "Tee ist maskulin: einen Tee.",
        "model": "Ich nehme einen Tee.",
        "kind": "correction"
      }
    ],
    "listening": {
      "text": "Der Tee kostet zwei Euro. Ein Stück Kuchen kostet vier Euro. Heute gibt es keinen Kaffee.",
      "question": "Was ist heute nicht verfügbar?",
      "options": [
        "Tee",
        "Kuchen",
        "Kaffee"
      ],
      "answer": 2,
      "explanation": "Heute gibt es keinen Kaffee."
    }
  },
  "act3": {
    "goal": "Eine Wohnung beschreiben",
    "writing": "Schreibe eine Nachricht zu einem WG-Zimmer: Stelle dich vor und frage nach Miete und Einzugstermin.",
    "speaking": "Beschreibe dein Zimmer. Wo stehen Tisch und Bett? Was möchtest du ändern?",
    "exercises": [
      {
        "prompt": "In meinem Zimmer steht ___ Tisch.",
        "answers": [
          "ein"
        ],
        "explanation": "Ein Tisch ist Nominativ: Er ist das Subjekt von steht.",
        "model": "In meinem Zimmer steht ein Tisch.",
        "kind": "gap"
      },
      {
        "prompt": "Ordne: ist / Die Küche / klein",
        "answers": [
          "Die Küche ist klein",
          "Klein ist die Küche"
        ],
        "explanation": "Das Verb steht an zweiter Position.",
        "model": "Die Küche ist klein.",
        "kind": "order"
      },
      {
        "prompt": "Korrigiere: Die Wohnung hat kein Balkon.",
        "answers": [
          "Die Wohnung hat keinen Balkon"
        ],
        "explanation": "Balkon ist maskulin und hier Akkusativ.",
        "model": "Die Wohnung hat keinen Balkon.",
        "kind": "correction"
      }
    ],
    "listening": {
      "text": "Das Zimmer ist ab Mai frei. Die Miete beträgt fünfhundert Euro. Die Küche teilen Sie mit zwei anderen Personen.",
      "question": "Ab wann ist das Zimmer frei?",
      "options": [
        "Ab März",
        "Ab Mai",
        "Ab Juni"
      ],
      "answer": 1,
      "explanation": "Das Zimmer ist ab Mai frei."
    }
  },
  "act4": {
    "goal": "Den Alltag und Verpflichtungen beschreiben",
    "writing": "Beschreibe einen normalen Tag: Aufstehen, Arbeit oder Kurs, Einkaufen und Freizeit.",
    "speaking": "Erkläre deinen Tagesablauf. Was musst du morgen machen? Was kannst du am Wochenende machen?",
    "exercises": [
      {
        "prompt": "Ich stehe um sieben Uhr ___.",
        "answers": [
          "auf"
        ],
        "explanation": "aufstehen ist trennbar: ich stehe ... auf.",
        "model": "Ich stehe um sieben Uhr auf.",
        "kind": "gap"
      },
      {
        "prompt": "Ordne: muss / heute / Ich / arbeiten",
        "answers": [
          "Ich muss heute arbeiten",
          "Heute muss ich arbeiten"
        ],
        "explanation": "Modalverb an Position zwei, Infinitiv am Ende.",
        "model": "Ich muss heute arbeiten.",
        "kind": "order"
      },
      {
        "prompt": "Korrigiere: Heute ich kaufe ein.",
        "answers": [
          "Heute kaufe ich ein"
        ],
        "explanation": "Nach Heute folgt das finite Verb; ein steht am Ende.",
        "model": "Heute kaufe ich ein.",
        "kind": "correction"
      }
    ],
    "listening": {
      "text": "Am Montag beginnt mein Kurs um acht Uhr. Danach arbeite ich bis sechzehn Uhr. Einkaufen gehe ich erst am Dienstag.",
      "question": "Wann geht die Person einkaufen?",
      "options": [
        "Am Montag",
        "Am Dienstag",
        "Am Sonntag"
      ],
      "answer": 1,
      "explanation": "Einkaufen gehe ich erst am Dienstag."
    }
  },
  "act5": {
    "goal": "Beschwerden beschreiben und einen Termin vereinbaren",
    "writing": "Schreibe der Arztpraxis: Beschreibe Beschwerden, seit wann du sie hast und wann du kommen kannst.",
    "speaking": "Bitte telefonisch um einen Termin. Der erste Termin passt nicht: Bitte um einen anderen.",
    "exercises": [
      {
        "prompt": "Der Arzt hilft ___. (ich)",
        "answers": [
          "mir"
        ],
        "explanation": "helfen verlangt Dativ: mir.",
        "model": "Der Arzt hilft mir.",
        "kind": "gap"
      },
      {
        "prompt": "Ordne: habe / seit gestern / Ich / Fieber",
        "answers": [
          "Ich habe seit gestern Fieber",
          "Seit gestern habe ich Fieber"
        ],
        "explanation": "Das finite Verb habe steht an Position zwei.",
        "model": "Ich habe seit gestern Fieber.",
        "kind": "order"
      },
      {
        "prompt": "Korrigiere: Ich brauche ein Termin.",
        "answers": [
          "Ich brauche einen Termin"
        ],
        "explanation": "Termin ist maskulin und nach brauchen Akkusativ.",
        "model": "Ich brauche einen Termin.",
        "kind": "correction"
      }
    ],
    "listening": {
      "text": "Die Praxis ist heute Nachmittag geschlossen. Sie können morgen um zehn Uhr kommen. Bringen Sie bitte Ihre Versicherungskarte mit.",
      "question": "Was soll die Person mitbringen?",
      "options": [
        "Einen Koffer",
        "Eine Rechnung",
        "Die Versicherungskarte"
      ],
      "answer": 2,
      "explanation": "Bringen Sie bitte Ihre Versicherungskarte mit."
    }
  },
  "act6": {
    "goal": "Reiseinformationen verstehen und nach dem Weg fragen",
    "writing": "Bitte ein Hotel um ein Zimmer für zwei Nächte. Nenne Datum, Personenzahl und eine Frage zur Anreise.",
    "speaking": "Frage nach dem Weg zum Bahnhof. Erkläre danach selbst einen Weg mit links, rechts und geradeaus.",
    "exercises": [
      {
        "prompt": "Wir sind mit dem Zug ___. (fahren)",
        "answers": [
          "gefahren"
        ],
        "explanation": "Eine Ortsveränderung mit fahren bildet das Perfekt hier mit sein.",
        "model": "Wir sind mit dem Zug gefahren.",
        "kind": "gap"
      },
      {
        "prompt": "Ordne: nach links / Sie / Gehen",
        "answers": [
          "Gehen Sie nach links"
        ],
        "explanation": "Bei der höflichen Aufforderung steht das Verb vor Sie.",
        "model": "Gehen Sie nach links.",
        "kind": "order"
      },
      {
        "prompt": "Korrigiere: Ich fahre mit den Bus.",
        "answers": [
          "Ich fahre mit dem Bus"
        ],
        "explanation": "mit verlangt Dativ: mit dem Bus.",
        "model": "Ich fahre mit dem Bus.",
        "kind": "correction"
      }
    ],
    "listening": {
      "text": "Der Zug nach München fährt heute von Gleis sieben ab, nicht von Gleis drei. Die Abfahrt ist um vierzehn Uhr zwanzig.",
      "question": "Von welchem Gleis fährt der Zug?",
      "options": [
        "Gleis 3",
        "Gleis 7",
        "Gleis 14"
      ],
      "answer": 1,
      "explanation": "Der Zug fährt heute von Gleis sieben ab."
    }
  },
  "act7": {
    "goal": "Über vergangene Erlebnisse berichten",
    "writing": "Schreibe einem Freund über dein letztes Wochenende. Beschreibe Aktivitäten, Begleitung und was dir gefallen hat.",
    "speaking": "Berichte ohne Vorlage über gestern. Stelle danach zwei Fragen zu den Erlebnissen einer anderen Person.",
    "exercises": [
      {
        "prompt": "Gestern ___ ich nach Hamburg gefahren.",
        "answers": [
          "bin"
        ],
        "explanation": "fahren mit Ortswechsel: ich bin gefahren.",
        "model": "Gestern bin ich nach Hamburg gefahren.",
        "kind": "gap"
      },
      {
        "prompt": "Ordne: einen Film / gesehen / habe / Ich",
        "answers": [
          "Ich habe einen Film gesehen",
          "Einen Film habe ich gesehen"
        ],
        "explanation": "haben steht an Position zwei; das Partizip steht am Ende.",
        "model": "Ich habe einen Film gesehen.",
        "kind": "order"
      },
      {
        "prompt": "Korrigiere: Wir haben ins Kino gegangen.",
        "answers": [
          "Wir sind ins Kino gegangen"
        ],
        "explanation": "gehen bildet das Perfekt mit sein.",
        "model": "Wir sind ins Kino gegangen.",
        "kind": "correction"
      }
    ],
    "listening": {
      "text": "Am Samstag habe ich meine Schwester besucht. Am Sonntag sind wir zusammen ins Museum gegangen. Den Film haben wir erst am Montag gesehen.",
      "question": "Was haben die Personen am Sonntag gemacht?",
      "options": [
        "Einen Film gesehen",
        "Die Schwester besucht",
        "Ein Museum besucht"
      ],
      "answer": 2,
      "explanation": "Am Sonntag sind wir zusammen ins Museum gegangen."
    }
  },
  "act8": {
    "goal": "Eine einfache Bewerbung schreiben und Gründe nennen",
    "writing": "Schreibe eine kurze Bewerbung: Stelle dich vor, beschreibe Erfahrung und Verfügbarkeit und bitte um ein Gespräch.",
    "speaking": "Stelle dich für eine Stelle vor. Warum möchtest du dort arbeiten? Wann kannst du anfangen?",
    "exercises": [
      {
        "prompt": "Ich bleibe zu Hause, weil ich krank ___.",
        "answers": [
          "bin"
        ],
        "explanation": "Im weil-Nebensatz steht das finite Verb am Ende.",
        "model": "Ich bleibe zu Hause, weil ich krank bin.",
        "kind": "gap"
      },
      {
        "prompt": "Ordne: Ich denke, / die Stelle / dass / interessant / ist",
        "answers": [
          "Ich denke dass die Stelle interessant ist"
        ],
        "explanation": "Nach dass steht das finite Verb am Ende.",
        "model": "Ich denke, dass die Stelle interessant ist.",
        "kind": "order"
      },
      {
        "prompt": "Korrigiere: Ich kann am Montag anfangen, weil ich habe Zeit.",
        "answers": [
          "Ich kann am Montag anfangen weil ich Zeit habe"
        ],
        "explanation": "Im weil-Nebensatz: weil ich Zeit habe.",
        "model": "Ich kann am Montag anfangen, weil ich Zeit habe.",
        "kind": "correction"
      }
    ],
    "listening": {
      "text": "Vielen Dank für Ihre Bewerbung. Wir möchten Sie am Donnerstag um elf Uhr kennenlernen. Bitte bestätigen Sie den Termin bis Dienstag per E-Mail.",
      "question": "Bis wann soll der Termin bestätigt werden?",
      "options": [
        "Bis Dienstag",
        "Bis Donnerstag",
        "Bis Freitag"
      ],
      "answer": 0,
      "explanation": "Bitte bestätigen Sie den Termin bis Dienstag per E-Mail."
    }
  }
};
