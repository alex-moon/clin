from datetime import datetime
from fabric.api import env


env.hosts = ['54.77.62.48']
env.user = 'ubuntu'

env.provision_flag = '/var/www/provisioned'
env.provision_script = '/home/ubuntu/provision.sh'

env.now = datetime.now().strftime('%Y-%m-%d-%H')
env.base_dir = '/var/www'
env.code_dir = '%(base_dir)s/clin' % env
env.local_tar = '/tmp/clin-%(now)s.tar.gz' % env
env.tmp_code_dir = '%(base_dir)s/clin-%(now)s' % env
env.unpack_path = '%(tmp_code_dir)s.tar.gz' % env
env.rds_conf = '%(base_dir)s/rds.conf' % env
