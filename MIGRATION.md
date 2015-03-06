# Migration

##
    nginx:  
        location ~ /(?:css|image|js|lib)/ ->
        location ~ /(?:modules)/
