# Vibe Coded Games Project

This is a gallery of prototype games built using generative AI as the primary author. It serves two functions:

* Help me to answer questions about game development with AI, as performed in [an artificial intelligence summer camp](https://aipathways.org) *(Note: the website is down as of 2026-04-29 when I am writing this.)*
  * What are the relative strengths and caveats of various LLMs for this purpose, considering: Claude Code, ChatGPT/Codex, Gemini, Copilot. Locally-run open weight models are out of scope for this project.
* Serve as a reference for students to see what is in the range of possibility for a few days' work (the time they will have in camp for this project.) 
* Demonstrate what a good design and prompting process looks like (I'm not an expert, however!)

## Game Platform

Games that students make must be playable in a browser, and shareable with a simple link—no installations allowed. In order to make the development process as straightforward as possible, the platform that we will strongly suggest that students use will be [p5.js](https://p5js.org/). Game engines such as Unity, Unreal, and Godot are out of scope for this project. Motivated students will be encouraged to explore these platforms on their own or in a more advanced version of the camp.

Other platforms which meet the requirement of being easy to share, preserve, and judge will be considered for students who want to "do their own thing;" [Replit](https://replit.com/) is one platform which may also work for our students.

## Team Shape

Teams will be encouraged to work in small teams of 2-3 students. This will serve several purposes:

* Allow students to specialize in roles they find most exciting: art, story, structure, debugging, etc.
* Expand idea generation and force practice with collaboration
* Increase the LLM token budget available to each team in a given day (each student is likely to have a paid account with at least one LLM during the camp.)

However, every year it's typical for some students in the camp to prefer working alone, and traditionally we have allowed this without issues.

## Development Time

Students will be able to devote their focus towards this project for approximately 4 calendar days before they are judged at the end of the work week. With typical session times resetting after about 5 hours, (it varies) once students have exhausted their quota with an LLM, they will effectively need to wait until the next day to resume coding work with that tool. (The students do not take the laptops home, and camp runs from 10AM to 3PM each day.) This means that games may be built with approximately 4 sessions of e.g. Claude Code per student. There are a variety of ways to work around the limit, such as encouraging students to work in teams.

## Game Genres

Games built in this repository should serve as inspiration for students, and cover several well-known genres, such as:

* Platform / action / arcade
* Word
* Puzzle
* RPG
* Simulation

With p5.js as the platform, certain genres (such as arcade) may be more realistic to get to a high level of polish in a few sessions than something with a complex story, characters, etc. We want that idea to be clear in this gallery; inviting students to make a game who haven't done so before is guaranteed to trigger some unreasonably ambitious project ideas. 

## Tools We Will Use

### No Agents or downloaded tools. Limited Filesystem interactions.

Although LLMs do their best work as agents, we will not be able to do that in this project. (Although the term "[agent](https://developer.nvidia.com/blog/introduction-to-llm-agents/)" can be used in different ways, in this case I'm using it to mean "downloadable app which is installed and can write code into files on the filesystem directly.") The student workflow will probably look something like:

1. Play a version of their game on p5.js and decide on next steps
2. Write those next steps into a prompt (and save it to a running Google doc)
3. Download the current code and save it to a local file
4. Prompt the LLM tool, uploading the current javascript for the game, an overview design guide, and the current prompt.
5. Copy/paste the resulting code updates into P5.js and repeat

The reason for this somewhat awkward workflow is that the students will be using Chromebooks which they don't have persistent accounts on. They will not be able to download and install software or interact with a filesystem as Windows/MacOS/Linux users are used to doing. Cursor, Visual Studio Code plugins, and the like are unavailable.

### Structured intermediary languages

LLMs (notably Claude Code) really do well with Markdown as structured input. Our students cannot be assumed to know Markdown or JSON at the start of camp. We are likely to include either or both of these formats as a lesson before they get down to real work on their game, facilitating describing complex ideas to the LLM and making efficient use of tokens.

### Tools for Asset generation

Images and sounds may also be generated with other LLMs, or done "by hand" if students prefer and it fits the style of their game.

## Questions this project must answer:

1. **How does each LLM listed above compare when asked to work on this challenge?** Early results (in Spring of 2026) indicate that Claude is *much* more effective at writing excellent working game code than its competitors. But students will likely want or need to use the other LLMs as well. Prototypes of each game will be developed on each LLM in isolation, even though students will not be limited in this way.
2. **Will we encounter limits with P5.js?** I do not have significant prior experience on the platform and do not know how it will perform if we throw thousands of lines of (potentially inefficient) javascript at it. I expect that performance limitations will emerge from the browsers running the game on student Chromebooks, but want to understand those limits through developing these examples.
3. **What specific steps must a team follow to make progress each day?** The daily rhythm described in the "Tools" section above must be understood well enough to capture in a detailed process document for students. Students in this camp do best when the instructors and students both know exactly what comes next; they are not experienced developers, so having specific steps to follow is very beneficial.
4. **What are realistic expectations for how much game can be built in 4 days?** Only by building a variety of games will we be able to set this expectation.

## Learning Objectives for Students

* Why yes, you can write code even if you've never done it before!
* How to describe bugs and new features to develop, in a way that a tool or human can actually help.
* Building something successful means having a plan and executing it.
* What is an LLM Token (in an intuitive sense)?
* Simple, highly polished games are generally more compelling than overscoped, unfinished masterpieces
* Great games can come out of ideas and visions which are made collectively (amongst humans)
  * In some cases, LLMs can be helpful during idea generation as well

## How to Contribute

1. Each game will exist within a folder in this project. Give it a simple name and don't use spaces in the directory structure.
2. Within a game's folder, add a markdown file which summarizes the game's basic design. This may be used to load context for an LLM with each prompt to work on that game.

2. Add a folder for any LLMs used to create a game. In this project, use only a single LLM per folder/implementation. Using different LLMs to create a version of each game is useful as a point of reference. (Using multiple LLMs is probably also fine if we label the folder clearly.)
3. If you use an LLM to generate any supplemental assets, leave those in the folder for that particular LLM—don't generate an "NPC Dialog" or "Level theme ideas" file with one LLM and use it to generate code with another LLM unless you explain that clearly somewhere.
4. Please maintain a log of the sessions used with each LLM to build the game. Students will be able to refer to these sessions to learn more about how to prompt effectively.

*(note: this README was written without the use of AI.)*