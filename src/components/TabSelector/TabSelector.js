import {View} from 'react-native';
import React, {useReducer, useRef} from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';
import * as Expensicons from '../Icon/Expensicons';
import TabSelectorItem from './TabSelectorItem';
import CONST from '../../CONST';
import useLocalize from '../../hooks/useLocalize';
import styles from '../../styles/styles';
import themeColors from '../../styles/themes/default';

const propTypes = {
    /* Navigation state provided by React Navigation */
    // eslint-disable-next-line react/forbid-prop-types
    state: PropTypes.object.isRequired,

    /* Navigation functions provided by React Navigation */
    navigation: PropTypes.shape({
        navigate: PropTypes.func.isRequired,
        emit: PropTypes.func.isRequired,
    }).isRequired,

    /* Callback fired when tab is pressed */
    onTabPress: PropTypes.func,

    /* AnimatedValue for the position of the screen while swiping */
    position: PropTypes.shape({
        interpolate: PropTypes.func.isRequired,
    }),
};

const defaultProps = {
    onTabPress: () => {},
    position: {
        interpolate: () => {},
    },
};

const getIconAndTitle = (route, translate) => {
    switch (route) {
        case CONST.TAB.MANUAL:
            return {icon: Expensicons.Pencil, title: translate('tabSelector.manual')};
        case CONST.TAB.SCAN:
            return {icon: Expensicons.Receipt, title: translate('tabSelector.scan')};
        case CONST.TAB.NEW_CHAT:
            return {icon: Expensicons.User, title: translate('tabSelector.chat')};
        case CONST.TAB.NEW_ROOM:
            return {icon: Expensicons.Hashtag, title: translate('tabSelector.room')};
        case CONST.TAB.DISTANCE:
            return {icon: Expensicons.Car, title: translate('common.distance')};
        default:
            throw new Error(`Route ${route} has no icon nor title set.`);
    }
};

const getOpacity = (position, routesLength, tabIndex, active, affectedTabs) => {
    const activeValue = active ? 1 : 0;
    const inactiveValue = active ? 0 : 1;

    if (routesLength > 1) {
        const inputRange = Array.from({length: routesLength}, (v, i) => i);

        return position.interpolate({
            inputRange,
            outputRange: _.map(inputRange, (i) => (affectedTabs.includes(tabIndex) && i === tabIndex ? activeValue : inactiveValue)),
        });
    }
    return activeValue;
};

const getBackgroundColor = (position, routesLength, tabIndex, affectedTabs) => {
    if (routesLength > 1) {
        const inputRange = Array.from({length: routesLength}, (v, i) => i);

        return position.interpolate({
            inputRange,
            outputRange: _.map(inputRange, (i) => (affectedTabs.includes(tabIndex) && i === tabIndex ? themeColors.border : themeColors.appBG)),
        });
    }
    return themeColors.border;
};

function TabSelector({state, navigation, onTabPress, position}) {
    const {translate} = useLocalize();
    const [, reRender] = useReducer((x) => !x, false);

    const defaultAffectedAnimatedTabs = Array.from({length: state.routes.length}, (v, i) => i);
    const affectedAnimatedTabs = useRef(defaultAffectedAnimatedTabs);

    React.useEffect(() => {
        setTimeout(() => {
            affectedAnimatedTabs.current = defaultAffectedAnimatedTabs;
            // re-render is important to re-defining opacity and background base on new affected tabs, to be ready for user swiping.
            reRender();
        }, CONST.ANIMATED_TRANSITION);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.index]);

    return (
        <View style={styles.tabSelector}>
            {_.map(state.routes, (route, index) => {
                const activeOpacity = getOpacity(position, state.routes.length, index, true, affectedAnimatedTabs.current);
                const inactiveOpacity = getOpacity(position, state.routes.length, index, false, affectedAnimatedTabs.current);
                const backgroundColor = getBackgroundColor(position, state.routes.length, index, affectedAnimatedTabs.current);
                const isFocused = index === state.index;
                const {icon, title} = getIconAndTitle(route.name, translate);

                const onPress = () => {
                    if (isFocused) {
                        return;
                    }

                    affectedAnimatedTabs.current = [state.index, index];
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!event.defaultPrevented) {
                        // The `merge: true` option makes sure that the params inside the tab screen are preserved
                        navigation.navigate({name: route.name, merge: true});
                    }

                    onTabPress(route.name);
                };

                return (
                    <TabSelectorItem
                        key={route.name}
                        icon={icon}
                        title={title}
                        onPress={onPress}
                        activeOpacity={activeOpacity}
                        inactiveOpacity={inactiveOpacity}
                        backgroundColor={backgroundColor}
                    />
                );
            })}
        </View>
    );
}

TabSelector.propTypes = propTypes;
TabSelector.defaultProps = defaultProps;
TabSelector.displayName = 'TabSelector';

export default TabSelector;
