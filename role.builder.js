var roleUpgrader = require('role.upgrader')
var roleHarvester = require('role.harvester')

function builderFilter(s){
    var structHits = s.hitsMax
    if(s.structureType === STRUCTURE_ROAD)
        structHits = 4000
    else if(s.structureType === STRUCTURE_WALL){
        if(39 <= s.pos.x)
            return false
        structHits = 50000
    }
    else if(s instanceof StructureRampart)
        structHits = 50000
    return s.hits < s.hitsMax && s.hits < structHits
}

// Tower and builder both repair structures, but their precedences are different
// in that towers can save cost of time spent for approaching targets.
// Towers are penalized by inefficiency for distant structures, but movement cost
// tend to surpass especially when body count increases after RCL gets high.
function towerBuilderFilter(s){
    var structHits = s.hitsMax
    if(s.structureType === STRUCTURE_ROAD)
        structHits = 3000
    else if(s.structureType === STRUCTURE_WALL){
        if(39 <= s.pos.x)
            return false
        structHits = 70000
    }
    else if(s instanceof StructureRampart)
        structHits = 70000
    return s.hits < s.hitsMax && s.hits < structHits
}

function findDamagedStructures(room){
    return room.find(FIND_STRUCTURES, {
        filter: s => towerBuilderFilter(s)
    });
}


var roleBuilder = {

    builderFilter: builderFilter,

    findDamagedStructures: findDamagedStructures,

    /** @param {Creep} creep **/
    run: function(creep) {

        if(creep.memory.building && creep.carry.energy == 0) {
            creep.memory.building = false;
            creep.memory.target = undefined
            creep.say('harvesting');
        }
        if(!creep.memory.building && creep.carry.energy == creep.carryCapacity){
            var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
            var targets2 = creep.room.find(FIND_STRUCTURES, {filter: builderFilter});
            if(targets.length || targets2.length) {
                creep.memory.building = true;
                creep.memory.resting = false;
                creep.say('building');
            }
        }

        if(creep.memory.building) {
            var target
            if(creep.memory.target && (target = Game.getObjectById(creep.memory.target))){
                //console.log('builder target: '+ target.id + ', ' + (target instanceof Structure))
                if(target instanceof Structure){
                    if(target.hits === target.hitsMax){
                        creep.memory.target = undefined
                    }
                    else if(creep.repair(target) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target);
                    }
                }
                else if(target instanceof ConstructionSite){
                    if(creep.build(target) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target);
                    }
                }
                else
                    creep.memory.target = undefined;
            }
            else{
                var target = creep.pos.findClosestByRange(FIND_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
                if(target && false){
                    creep.memory.target = target.id
                }
                else{
                    var target = creep.pos.findClosestByRange(FIND_STRUCTURES, {filter: builderFilter});
                    if(target){
                        creep.memory.target = target.id
                    }
                    else{
                        var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
                        if(targets.length) {
                            creep.memory.target = targets[0].id
                        }
                        else
                            creep.memory.target = undefined
                    }
                }
                if(!creep.memory.target){
                    creep.memory.building = false;
                    creep.memory.target = undefined
                }
            }
        }
        else{
            // Delegate logic to harvester altogether since harvester has more
            // sophisticated precedence.
            roleHarvester.run(creep)
        }
    }
};

module.exports = roleBuilder;
