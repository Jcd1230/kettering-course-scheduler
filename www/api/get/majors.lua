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

local res, err = db:query([[SELECT
  P.program_id AS id,
  P.program_name AS name,
  P.abbreviation AS abbr
FROM sch.program as P;
]])

db:set_keepalive(0,100)
if not res then
	ngx.say("ERROR: "..err)
	ngx.eof()
end

local majors = {}

for i,v in ipairs(res) do
	majors[v.id+1] = {
		name = v.name,
		abbr = v.abbr
	}
end

ngx.say(json.encode(majors))




