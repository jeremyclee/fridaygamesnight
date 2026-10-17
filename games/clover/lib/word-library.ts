/**
 * Built-in word library. Published puzzles store their words directly, so
 * this list can be edited freely; it only affects newly generated boards.
 *
 * Words are 3–7 letters, uppercase A–Z, and familiar to most players.
 */

const V1 = `
ant bat bear bee bird cat cow crab crow deer dog duck eagle eel fish fox frog
goat goose hen horse lion llama mole moose mouse mule owl panda parrot pig pony
puppy rabbit rat robin seal shark sheep snail snake spider squid swan tiger toad
trout turkey turtle whale wolf worm zebra camel koala lizard monkey otter beaver
kitten dragon unicorn dolphin penguin octopus chicken giraffe hamster gorilla
lobster donkey bunny falcon pigeon salmon oyster

apple banana bread butter cake candy carrot cheese cherry chili cookie corn
cream egg flour fries grape honey jam juice lemon lime mango melon milk mint
noodle olive onion orange pasta peach peanut pear pepper pickle pie pizza plum
potato pumpkin rice salad salt sauce soup steak sugar taco tea toast tomato
waffle bacon bagel burger donut coffee cocoa curry garlic ginger yogurt muffin
pancake cereal biscuit sushi kiwi berry bean nut oats popcorn pretzel cupcake
jelly treat feast lunch dinner snack picnic

bath bed bell blanket bowl box brush bucket candle carpet chair clock couch cup
curtain desk door drawer fork glass hammer jar kettle key knife ladder lamp lock
mirror mug nail oven pan pillow plate pot rug shelf sink soap sofa spoon stairs
stove table towel tray vase wall window broom fridge garage garden attic closet
cradle basket sponge needle thread button zipper ribbon rope tape glue pencil
pen paper book letter stamp card map poster photo frame album diary

bank beach bridge cabin camp castle cave church city farm field forest hill
house island jungle lake library market moon museum ocean office palace park
planet pond pool prison river road school sea shop space station store street
temple tower town valley village zoo desert canyon harbor airport hotel cinema
stadium bakery circus theater kitchen bedroom cellar

air ash cloud dawn dew dust earth fire flame fog frost grass hail ice leaf
light lava mist moss mud night rain rainbow rock root rose sand seed shade sky
smoke snow soil star stone storm sun sunset thunder tide tree wave wind wood
thorn petal bloom flower daisy tulip lily oak pine maple branch acorn bush
cactus breeze comet galaxy meteor volcano glacier crystal pebble shell coral

arm back beard blood bone brain cheek chin ear elbow eye face finger foot hair
hand head heart heel hip knee leg lip mouth neck nose skin skull smile teeth
thumb toe tongue tooth wrist belly

belt boot cap cape coat crown dress glove hat helmet jacket jeans mask mitten
pants purse ring robe scarf shirt shoe skirt sock suit sweater tie vest wallet
watch pajamas apron badge uniform sandal slipper

bike boat bus car cart jet plane raft rocket sail ship sled taxi tractor train
truck van wagon wheel engine anchor bicycle canoe ferry subway tunnel highway
ticket pilot

actor angel artist author baby baker boss bride chef clown coach cook doctor
farmer giant ghost guard guest hero judge king knight lawyer nurse pirate poet
prince queen robot sailor scout singer soldier spy student teacher thief twin
uncle aunt witch wizard child friend family mother father sister brother cousin
captain dancer driver hunter monster vampire zombie alien fairy ninja mermaid
cowboy viking

art band bass choir drum flute guitar harp horn jazz music note opera piano poem
song tune violin dance drama movie paint ballet rhythm concert melody trumpet
radio stage film comic story novel puzzle magic

ball chess dice game goal golf race score ski skate team tennis trophy match
medal kick jump arena hockey soccer boxing karate bowling frisbee toy doll kite
marble balloon whistle

day hour minute month noon season spring summer winter autumn week year future
past holiday weekend morning evening moment history century

battery camera coin cable phone laptop screen magnet laser wire tool drill saw
axe shovel barrel bottle chain gear switch remote printer speaker compass
lantern torch flag globe fence gate roof brick tent tile pipe hose bench swing
slide ramp statue jewel gem pearl diamond gold silver copper iron steel metal
plastic rubber cotton wool silk leather wax clay ink chalk crayon eraser ruler
folder

love hope fear joy luck peace war truth lie dream wish idea secret memory
promise chance danger power energy speed time money price gift party wedding
prize fame freedom justice fortune mystery riddle answer problem silence noise
echo shadow spirit soul heaven myth legend habit humor talent skill rule law
crime

bake bark bite blow boil bounce break build burn buy call carry catch chase
cheer chew clap climb crash crawl cry cut dig dive draw drink drive drop eat
fall feed fight fill find float fly fold follow freeze give grow hide hit hold
hug hunt kiss knit knock laugh lead learn lift listen march melt mix move open
pack pay pick plant play pour pull push read ride roar roll run rush save scream
search sell send sew shake shine shout sing sit skip sleep smell snore spin
splash steal stir swim talk teach throw tickle travel turn twist wake walk wash
whisper win wink write yawn yell zoom

angry big bitter black blue bold brave bright broken busy calm cheap clean
clever cold cool crazy cute dark deep dirty dry early easy empty fake fast fancy
free fresh full funny gentle glad good gray great green happy hard heavy hidden
high hollow hot huge hungry icy kind large late lazy little lonely long loud
lucky messy new nice noisy old pink plain poor proud purple quick quiet rare raw
red rich ripe rough round royal rusty sad safe salty scary sharp shiny short shy
sick silly simple slow small smart smooth soft sour spicy sticky strong sweet
tall tiny tired tough warm weird wet white wide wild wise yellow young

sword shield arrow cannon throne chest alarm arch bag barn base beam blade block
board bolt bubble cage circle club code corner crack cross cube curve dot edge
feather fan net nest knot hole hook kit lid line list loop mail mark maze model
motor page path piece pile pin pit plug pocket point pole post pump rack rod
sack seat shape sheet sign spot square stick strip tank target tip token track
trap tube vault web wing yard zone
`;

export const WORDS: readonly string[] = V1.trim()
  .split(/\s+/)
  .map((word) => word.toUpperCase());

export const MIN_WORD_LENGTH = 3;
export const MAX_WORD_LENGTH = 7;
