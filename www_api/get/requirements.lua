local pg = require("resty.postgres")
local serpent = require("serpent")
local json = require("cjson")
local args = ngx.req.get_uri_args()
local db = pg:new()
db:set_timeout(3000)

local ok, err = db:connect({host="104.236.20.55",port=5432, database="dev",
                            user="postgres",password="notthebees",compact=false})

if not ok then
    ngx.say(err)
end

local res, err = db:query(([[
SELECT
  PG.program_group_id AS gid,
  PG.name,
  PG.min_credits,
  C.course_id
FROM sch.program as P
JOIN sch.program_group AS PG
  ON PG.program_id = P.program_id
JOIN sch.program_group_course AS PGC
  ON PGC.program_group_id = PG.program_group_id
JOIN sch.course AS C
  ON C.course_id = PGC.course_id
WHERE P.program_id = MAJOR
ORDER BY PG.priority ASC;
]]):gsub("MAJOR", pg.escape_string(args.major)))

db:set_keepalive(0,100)
if not res then
	ngx.say("ERROR: "..err)
	ngx.eof()
end

--ngx.say(serpent.block(res))

local requirements = {}
local category = {}
local groups = {}

for i,v in ipairs(res) do
	if not category[v.name] then
		local newcat = { name = v.name, subgroups = {} }
		category[v.name] = { cat = newcat, groups = {} } 
		table.insert(requirements, newcat)
	end
	if not category[v.name].groups[v.gid] then
		local newgroup = { min_credits = v.min_credits, courses = {} }
		category[v.name].groups[v.gid] = newgroup
		table.insert(category[v.name].cat.subgroups, newgroup)
	end
	table.insert(category[v.name].groups[v.gid].courses, v.course_id)
end

--ngx.say(serpent.block(requirements))
ngx.say(json.encode(requirements))