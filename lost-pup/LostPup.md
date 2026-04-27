## Lost Pup

We're going to be coding a game on P5.js. Instead of making an arcade game, I'd like to see if we can try to make a simple classic RPG. I'm thinking of EarthBound for the SNES as a point of reference, although let's reduce the scope for now.

Let's call the game "lost pup" and make it about a dog who gets away from its family while visiting an outdoor state fair. the dog will be the main character, and encounter a variety of challenges as it attempts to get back to its family.

## Purpose

This is a prototype intended to answer several questions about creating a game on P5.js:

- Is it straightforward to create a game which would naturally be organized with object-oriented design in p5.js?
- How complex is it to manage transitions between multiple screens for encounters with NPCs and an overworld?
- How much story can fit into a P5.js game before we encounter editor limits?
- How long does it take players to make their way through an RPG?

## Story

### Setup

1. A family visits the state fair and brings their family dog, who happily tags along at the pet-friendly event
2. While the family rides a ferris wheel, they tie the dog to a temporary barrier/fence around the ride.
3. A farmer leading her prize-winning cow through the crowd poses for a photo, but the flash and the crowd spook the cow, who bolts, knocking over the fence.
4. The dog flees from the ensuing melee and begins looking for the family (we know that they are still on the ferris wheel but the dog does not)
5. The player takes over with the dog waking up in a holding pen; some helpers who were sorting out the scene around the chaos of the escaped cow caught the dog and put it in an paddock in the "small animal competition" area.

### Challenges

The player will navigate a series of challenges to:

1. Escape from the holding pen
2. Start sniffing around to find clues about their family's location
3. Eventually reuinite with the family

### Opponent

The "main boss" of the fair will be the chief of operations, who is a stern, clipboard-weilding administrator who is looking for any reason to banish pets from the fairgrounds permanently. He teams up with an animal control team to try and catch the dog and fine the family who "let them run loose."

## Player Abilities

The player can use "Bark" and "Sniff" in encounters or in the overmap.

### Bark

When in an encounter, the player can bark. Sometimes this startles the opponent, sometimes it makes them afraid (and weakens them), and if the opponent is a friend of dogs, it makes them want to help the dog.

### Bite

When in an encounter, the player can bite. This does damage to the opponent and costs them hit points.

### Sniff

When in the overmap, the player can sniff to try and find out how recently the dog's family was in this spot. Players can try to figure out how to get closer to the family by using sniff repeatedly and looking for fresher scents.

When in an encounter, the player can use sniff to get a sense of opponents disposition towards the player, hit points, etc.