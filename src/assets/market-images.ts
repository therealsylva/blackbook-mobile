import type { ImageSourcePropType } from 'react-native';

const IMAGES: Record<string, ImageSourcePropType> = {
  'real-madrid': require('./indices/real-madrid.png'),
  'lamine-profile': require('./indices/lamine-avatar-v2.jpg'),
  'kendrick-lamar': require('./indices/kendrick-lamar.jpg'),
  drake: require('./indices/drake.jpg'),
  'openai-icon': require('./indices/openai-icon.png'),
  apple: require('./indices/apple.png'),
  'kylian-mbappe': require('./indices/mbappe-avatar-v2.jpg'),
  'fcb-icon': require('./indices/fcb-icon.png'),
  'elon-musk': require('./indices/elon-musk.jpg'),
  'premier-league': require('./indices/premier-league.png'),
  psg: require('./indices/psg.png'),
  'eminem-profile': require('./indices/eminem-profile.jpg'),
  'los-angeles-lakers': require('./indices/los-angeles-lakers.png'),
  'boston-celtics': require('./indices/boston-celtics.png'),
  'kansas-city-chiefs': require('./indices/kansas-city-chiefs.png'),
  'dallas-cowboys': require('./indices/dallas-cowboys.png'),
  'spotify-icon': require('./indices/spotify-icon.png'),
  'claude-icon': require('./indices/claude-icon.jpg'),
  arsenal: require('./indices/arsenal.png'),
  'liverpool-crest': require('./indices/liverpool-crest.png'),
  'manchester-city': require('./indices/manchester-city.png'),
  'manchester-united': require('./indices/manchester-united.png'),
  'lebron-profile': require('./indices/lebron-avatar-v2.jpg'),
  'vinicius-junior': require('./indices/vinicius-avatar-v2.jpg'),
  'erling-haaland': require('./indices/haaland-avatar-v2.jpg'),
  'jude-bellingham': require('./indices/bellingham-avatar-v2.jpg'),
  'taylor-swift': require('./indices/taylor-swift.jpg'),
  beyonce: require('./indices/beyonce.jpg'),
  'the-weeknd': require('./indices/the-weeknd.jpg'),
  'bad-bunny': require('./indices/bad-bunny.jpg'),
  'kanye-west': require('./indices/kanye-west.jpg'),
  'travis-scott': require('./indices/travis-scott.jpg'),
  'doja-cat': require('./indices/doja-cat.jpg'),
  future: require('./indices/future.jpg'),
  'central-cee': require('./indices/central-cee.jpg'),
};

export function marketImage(assetKey: string) {
  return IMAGES[assetKey];
}
